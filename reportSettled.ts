interface Settled {
  status: string;
  value?: any;
  reason?: any;
}
export function reportSettled(settled: Settled[]) {
  settled
    .filter((p) => p.status === "rejected")
    .forEach((p) => console.log(p.reason));
}
