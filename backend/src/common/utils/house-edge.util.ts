/** House edge = 100% - RTP (e.g. RTP 96.5 → house edge 3.5). */
export function computeHouseEdge(targetRtp: string | number): string {
  const rtp = typeof targetRtp === 'string' ? parseFloat(targetRtp) : targetRtp;
  return (100 - rtp).toFixed(2);
}
