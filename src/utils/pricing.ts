const pricingTable = {
  PS5: 1,
  PS4: 0.75,
  SIM_RACING: 3,
  VIP_PC: 2,
};

export function calculateSessionPrice(
  deviceType: string,
  hours: number
) {

  const rate =
    pricingTable[
      deviceType as keyof typeof pricingTable
    ] || 1;

  return rate * hours;
}