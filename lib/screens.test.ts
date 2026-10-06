import { describe, expect, it } from "vitest";
import { computeScreenStatus } from "./screens";

describe("computeScreenStatus", () => {
  it("is ready_to_play when the screen has never checked in", () => {
    expect(computeScreenStatus({ lastHeartbeatAt: null })).toBe("ready_to_play");
  });

  it("is online when the last heartbeat was recent", () => {
    const tenSecondsAgo = new Date(Date.now() - 10_000);
    expect(computeScreenStatus({ lastHeartbeatAt: tenSecondsAgo })).toBe("online");
  });

  it("is online right at the 90s threshold", () => {
    const ninetySecondsAgo = new Date(Date.now() - 90_000);
    expect(computeScreenStatus({ lastHeartbeatAt: ninetySecondsAgo })).toBe("online");
  });

  it("is offline once the heartbeat is older than 90s", () => {
    const twoMinutesAgo = new Date(Date.now() - 120_000);
    expect(computeScreenStatus({ lastHeartbeatAt: twoMinutesAgo })).toBe("offline");
  });
});
