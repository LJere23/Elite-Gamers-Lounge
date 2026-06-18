import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { triggerMatchSettlement, triggerTournamentSettlement } from "@/lib/betting";

function nextPowerOfTwo(n: number) {
  return 2 ** Math.ceil(Math.log2(n));
}

function getStage(matchCount: number, round: number): string {
  if (matchCount === 1) return "Final";
  if (matchCount === 2) return "Semi Final";
  if (matchCount === 4) return "Quarter Final";
  return round === 1 ? "Round 1" : "Round " + round;
}

function getScoreThreshold(scoringSystem: string) {
  if (scoringSystem === "best_of_3") return 2;
  if (scoringSystem === "best_of_5") return 3;
  return 1;
}

type MatchRow = Awaited<ReturnType<typeof prisma.tournamentMatch.findUnique>> & {};
type TournamentRow = Awaited<ReturnType<typeof prisma.tournament.findUnique>> & {};

function serializeMatch(m: NonNullable<MatchRow>) {
  return {
    ...m,
    scheduledAt: m.scheduledAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
  };
}

function determineWinner(
  match: {
    playerAId: string;
    playerAName: string;
    playerBId: string;
    playerBName: string;
    scoreA: number | null;
    scoreB: number | null;
  },
  format: string
): { winnerId: string | null; winnerName: string | null } {
  const { scoreA, scoreB, playerAId, playerAName, playerBId, playerBName } = match;
  if (typeof scoreA !== "number" || typeof scoreB !== "number") {
    return { winnerId: null, winnerName: null };
  }

  if (format === "fastest_lap") {
    if (scoreA < scoreB) return { winnerId: playerAId, winnerName: playerAName };
    if (scoreB < scoreA) return { winnerId: playerBId, winnerName: playerBName };
    return { winnerId: null, winnerName: null };
  }

  if (scoreA > scoreB) return { winnerId: playerAId, winnerName: playerAName };
  if (scoreB > scoreA) return { winnerId: playerBId, winnerName: playerBName };
  return { winnerId: null, winnerName: null };
}

function processSeriesScoring(
  merged: Record<string, unknown>,
  threshold: number
): {
  seriesWinsA: number;
  seriesWinsB: number;
  winnerId: string | null;
  winnerName: string | null;
  status: string;
} {
  let seriesWinsA = 0;
  let seriesWinsB = 0;

  const g1A = merged.game1ScoreA as number | null | undefined;
  const g1B = merged.game1ScoreB as number | null | undefined;
  const g2A = merged.game2ScoreA as number | null | undefined;
  const g2B = merged.game2ScoreB as number | null | undefined;
  const g3A = merged.game3ScoreA as number | null | undefined;
  const g3B = merged.game3ScoreB as number | null | undefined;

  if (typeof g1A === "number" && typeof g1B === "number") {
    if (g1A > g1B) seriesWinsA++;
    else if (g1B > g1A) seriesWinsB++;
  }
  if (typeof g2A === "number" && typeof g2B === "number") {
    if (g2A > g2B) seriesWinsA++;
    else if (g2B > g2A) seriesWinsB++;
  }
  if (typeof g3A === "number" && typeof g3B === "number") {
    if (g3A > g3B) seriesWinsA++;
    else if (g3B > g3A) seriesWinsB++;
  }

  let winnerId: string | null = null;
  let winnerName: string | null = null;
  let status = (merged.status as string) ?? "scheduled";

  if (seriesWinsA >= threshold) {
    winnerId = merged.playerAId as string;
    winnerName = merged.playerAName as string;
    status = "completed";
  } else if (seriesWinsB >= threshold) {
    winnerId = merged.playerBId as string;
    winnerName = merged.playerBName as string;
    status = "completed";
  }

  return { seriesWinsA, seriesWinsB, winnerId, winnerName, status };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; matchId: string }> }
) {
  const authErr = await requireAdmin(request);
  if (authErr) return authErr;

  const { id, matchId } = await context.params;
  const updates = await request.json();

  // 1. Get tournament
  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  // 2. Get match
  const match = await prisma.tournamentMatch.findUnique({ where: { id: matchId } });
  if (!match || match.tournamentId !== id) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  // 3. Already completed
  if (match.status === "completed") {
    return NextResponse.json({ error: "Match already completed" }, { status: 409 });
  }

  // 4. Validate scores
  const hasScoreA = Object.prototype.hasOwnProperty.call(updates, "scoreA");
  const hasScoreB = Object.prototype.hasOwnProperty.call(updates, "scoreB");
  if (hasScoreA || hasScoreB) {
    if (typeof updates.scoreA !== "number" || typeof updates.scoreB !== "number") {
      return NextResponse.json({ error: "Both scoreA and scoreB must be numbers" }, { status: 400 });
    }
    if (
      (tournament.format === "knockout" || tournament.format === "double_elimination") &&
      updates.scoreA === updates.scoreB
    ) {
      return NextResponse.json({ error: "Draws are not allowed in knockout/elimination format" }, { status: 400 });
    }
  }

  // 5. Build updates object
  const matchData: Record<string, unknown> = { ...updates };

  // Merge existing match values so helper functions can reference them
  const merged: Record<string, unknown> = {
    playerAId: match.playerAId,
    playerAName: match.playerAName,
    playerBId: match.playerBId,
    playerBName: match.playerBName,
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    game1ScoreA: match.game1ScoreA,
    game1ScoreB: match.game1ScoreB,
    game2ScoreA: match.game2ScoreA,
    game2ScoreB: match.game2ScoreB,
    game3ScoreA: match.game3ScoreA,
    game3ScoreB: match.game3ScoreB,
    seriesWinsA: match.seriesWinsA,
    seriesWinsB: match.seriesWinsB,
    status: match.status,
    ...updates,
  };

  const threshold = getScoreThreshold(tournament.scoringSystem);
  const hasGameScores =
    updates.game1ScoreA !== undefined ||
    updates.game1ScoreB !== undefined ||
    updates.game2ScoreA !== undefined ||
    updates.game2ScoreB !== undefined ||
    updates.game3ScoreA !== undefined ||
    updates.game3ScoreB !== undefined;

  // 6. Handle best-of series
  if (tournament.scoringSystem !== "best_of_1" && hasGameScores) {
    const series = processSeriesScoring(merged, threshold);
    matchData.seriesWinsA = series.seriesWinsA;
    matchData.seriesWinsB = series.seriesWinsB;
    if (series.winnerId) {
      matchData.winnerId = series.winnerId;
      matchData.winnerName = series.winnerName;
      matchData.status = "completed";
    }
  }

  // 7. If completing the match by status or scores, determine winner
  const finalStatus = (matchData.status as string) ?? match.status;
  if (finalStatus === "completed" && !matchData.winnerId) {
    const scoreA = typeof matchData.scoreA === "number" ? matchData.scoreA : match.scoreA;
    const scoreB = typeof matchData.scoreB === "number" ? matchData.scoreB : match.scoreB;
    const { winnerId, winnerName } = determineWinner(
      {
        playerAId: match.playerAId,
        playerAName: match.playerAName,
        playerBId: match.playerBId,
        playerBName: match.playerBName,
        scoreA,
        scoreB,
      },
      tournament.format
    );
    matchData.winnerId = winnerId;
    matchData.winnerName = winnerName;
  }

  // Strip any fields not in the Prisma schema (scheduledAt must be a Date if provided)
  if (matchData.scheduledAt && typeof matchData.scheduledAt === "string") {
    matchData.scheduledAt = new Date(matchData.scheduledAt);
  }

  // 8. Update match in Prisma
  const updatedMatch = await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: matchData as Parameters<typeof prisma.tournamentMatch.update>[0]["data"],
  });

  // Fire betting settlement asynchronously — must not block or fail the match update
  if ((matchData.status as string) === "completed") {
    triggerMatchSettlement(matchId).catch((e) => console.error("[betting-hook/match]", e));
  }

  const currentRound = tournament.currentRound ?? 1;

  // 9. For points_league: recompute standings
  if (tournament.format === "points_league") {
    const allLeagueMatches = await prisma.tournamentMatch.findMany({
      where: { tournamentId: id },
    });
    const allEntries = await prisma.tournamentEntry.findMany({ where: { tournamentId: id } });

    const standingsMap: Record<string, { wins: number; losses: number; points: number }> = {};
    for (const e of allEntries) {
      standingsMap[e.playerId ?? e.id] = { wins: 0, losses: 0, points: 0 };
    }

    for (const m of allLeagueMatches) {
      if (m.status !== "completed") continue;
      if (typeof m.scoreA !== "number" || typeof m.scoreB !== "number") continue;
      const a = standingsMap[m.playerAId];
      const b = standingsMap[m.playerBId];
      if (!a || !b) continue;
      if (m.scoreA > m.scoreB) {
        a.wins++;
        b.losses++;
        a.points += 3;
      } else if (m.scoreB > m.scoreA) {
        b.wins++;
        a.losses++;
        b.points += 3;
      } else {
        a.points += 1;
        b.points += 1;
      }
    }

    for (const e of allEntries) {
      const s = standingsMap[e.playerId ?? e.id];
      if (s) {
        await prisma.tournamentEntry.update({
          where: { id: e.id },
          data: { wins: s.wins, losses: s.losses, points: s.points },
        });
      }
    }

    // 10. Check if all league matches completed -> declare champion
    const allCompleted = allLeagueMatches.every((m) => m.status === "completed");
    if (allCompleted) {
      const updatedEntries = await prisma.tournamentEntry.findMany({ where: { tournamentId: id } });
      const sorted = [...updatedEntries].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.wins - a.wins;
      });
      const champion = sorted[0];
      const runnerUp = sorted[1];
      if (champion) {
        await prisma.tournament.update({
          where: { id },
          data: {
            winnerId: champion.playerId,
            winnerName: champion.playerName,
            runnerUpId: runnerUp?.playerId ?? null,
            runnerUpName: runnerUp?.playerName ?? null,
            status: "completed",
            completedAt: new Date(),
          },
        });
        const announcementText = `${tournament.name} Champion — ${champion.playerName} — Prize: $${tournament.prizeUsd}`;
        await prisma.announcement.create({
          data: {
            message: announcementText,
            tournamentId: id,
            tournamentName: tournament.name,
            winnerName: champion.playerName,
            prizeAmount: String(tournament.prizeUsd),
            type: "champion",
            createdAt: new Date(),
          },
        });
        await prisma.notification.create({
          data: { message: announcementText, severity: "info" },
        });
        triggerTournamentSettlement(id).catch((e) => console.error("[betting-hook/league]", e));
      }
    }
  }

  // 10. For knockout/double_elimination: check for Final completion or advance round
  if (tournament.format === "knockout" || tournament.format === "double_elimination") {
    // Check if a Final/Grand Final just completed
    if (
      updatedMatch.status === "completed" &&
      (updatedMatch.stage === "Final" || updatedMatch.stage === "Grand Final") &&
      updatedMatch.winnerId
    ) {
      const loserName =
        updatedMatch.winnerId === updatedMatch.playerAId
          ? updatedMatch.playerBName
          : updatedMatch.playerAName;
      const runnerUpId =
        updatedMatch.winnerId === updatedMatch.playerAId
          ? updatedMatch.playerBId
          : updatedMatch.playerAId;

      const alreadyDone = await prisma.tournament.findUnique({ where: { id } });
      if (alreadyDone && alreadyDone.status !== "completed") {
        await prisma.tournament.update({
          where: { id },
          data: {
            winnerId: updatedMatch.winnerId,
            winnerName: updatedMatch.winnerName,
            runnerUpId,
            runnerUpName: loserName,
            status: "completed",
            completedAt: new Date(),
          },
        });
        const announcementText = `${tournament.name} Champion — ${updatedMatch.winnerName} — Prize: $${tournament.prizeUsd}`;
        await prisma.announcement.create({
          data: {
            message: announcementText,
            tournamentId: id,
            tournamentName: tournament.name,
            winnerName: updatedMatch.winnerName,
            prizeAmount: String(tournament.prizeUsd),
            type: "champion",
            createdAt: new Date(),
          },
        });
        await prisma.notification.create({
          data: { message: announcementText, severity: "info" },
        });
        triggerTournamentSettlement(id).catch((e) => console.error("[betting-hook/knockout]", e));
      }
    } else {
      // 11. RACE CONDITION FIX: reload all matches fresh from DB before checking round completion
      const freshMatches = await prisma.tournamentMatch.findMany({
        where: { tournamentId: id, bracket: "winner" },
      });
      const currentRoundMatches = freshMatches.filter(
        (m) => m.round === currentRound && !m.isBye
      );
      const allCompleted =
        currentRoundMatches.length > 0 &&
        currentRoundMatches.every((m) => m.status === "completed");

      if (allCompleted) {
        // Check if tournament already complete
        const tournamentNow = await prisma.tournament.findUnique({ where: { id } });
        if (tournamentNow && tournamentNow.status !== "completed") {
          // Gather winners from current round
          const winners = freshMatches
            .filter((m) => m.round === currentRound && m.status === "completed" && m.winnerId)
            .map((m) => ({
              id: m.winnerId as string,
              name: m.winnerId === m.playerAId ? m.playerAName : m.playerBName,
            }));

          if (winners.length > 1) {
            const nextRound = currentRound + 1;
            const alreadyExists = freshMatches.some((m) => m.round === nextRound);
            if (!alreadyExists) {
              const bracketSize = nextPowerOfTwo(winners.length);
              const paddedWinners = [...winners, ...Array(bracketSize - winners.length).fill(null)];
              const nextMatches: {
                id: string;
                tournamentId: string;
                playerAId: string;
                playerAName: string;
                playerBId: string;
                playerBName: string;
                scheduledAt: Date;
                status: string;
                scoreA: number | null;
                scoreB: number | null;
                winnerId: string | null;
                winnerName: string | null;
                isBye: boolean;
                round: number;
                stage: string;
                bracket: string;
                seriesWinsA: number;
                seriesWinsB: number;
              }[] = [];

              for (let i = 0; i < paddedWinners.length; i += 2) {
                const playerA = paddedWinners[i] as { id: string; name: string } | null;
                const playerB = paddedWinners[i + 1] as { id: string; name: string } | null;
                const isBye = !playerA || !playerB;
                const newWinnerId = isBye ? (playerA?.id ?? playerB?.id ?? null) : null;
                const stage = getStage(bracketSize / 2, nextRound);

                nextMatches.push({
                  id: crypto.randomUUID(),
                  tournamentId: id,
                  playerAId: playerA?.id ?? "",
                  playerAName: playerA?.name ?? "BYE",
                  playerBId: playerB?.id ?? "",
                  playerBName: playerB?.name ?? "BYE",
                  scheduledAt: new Date(Date.now() + (i / 2) * 15 * 60 * 1000),
                  status: isBye ? "completed" : "scheduled",
                  scoreA: isBye ? (playerA ? threshold : 0) : null,
                  scoreB: isBye ? (playerB ? threshold : 0) : null,
                  winnerId: newWinnerId,
                  winnerName: isBye ? (playerA ? playerA.name : (playerB?.name ?? null)) : null,
                  isBye,
                  round: nextRound,
                  stage,
                  bracket: "winner",
                  seriesWinsA: 0,
                  seriesWinsB: 0,
                });
              }

              await prisma.tournamentMatch.createMany({ data: nextMatches });
              await prisma.tournament.update({
                where: { id },
                data: { currentRound: nextRound },
              });
            }
          } else if (winners.length === 1) {
            // Only one winner — tournament is done (e.g., single final match not yet caught above)
            const champion = winners[0];
            const finalMatch = freshMatches.find(
              (m) =>
                m.round === currentRound &&
                m.status === "completed" &&
                (m.stage === "Final" || m.stage === "Grand Final")
            );
            const runnerUpId = finalMatch
              ? finalMatch.winnerId === finalMatch.playerAId
                ? finalMatch.playerBId
                : finalMatch.playerAId
              : null;
            const runnerUpName = finalMatch
              ? finalMatch.winnerId === finalMatch.playerAId
                ? finalMatch.playerBName
                : finalMatch.playerAName
              : null;

            await prisma.tournament.update({
              where: { id },
              data: {
                winnerId: champion.id,
                winnerName: champion.name,
                runnerUpId,
                runnerUpName,
                status: "completed",
                completedAt: new Date(),
              },
            });
            const announcementText = `${tournament.name} Champion — ${champion.name} — Prize: $${tournament.prizeUsd}`;
            await prisma.announcement.create({
              data: {
                message: announcementText,
                tournamentId: id,
                tournamentName: tournament.name,
                winnerName: champion.name,
                prizeAmount: String(tournament.prizeUsd),
                type: "champion",
                createdAt: new Date(),
              },
            });
            await prisma.notification.create({
              data: { message: announcementText, severity: "info" },
            });
          }
        }
      }
    }
  }

  // 12. Return updated match serialized
  return NextResponse.json(serializeMatch(updatedMatch));
}
