import { describe, it, expect } from "vitest";
import { validateTargetUrl, isPrivateIp } from "../src/lib/engine/ssrf-guard";

describe("SSRF Guard & Perimeter Defense", () => {
  it("blocks localhost, loopback, and 0.0.0.0", async () => {
    const loopback1 = await validateTargetUrl("http://localhost:3000");
    expect(loopback1.isAllowed).toBe(false);
    expect(loopback1.reason).toContain("SSRF defense");

    const loopback2 = await validateTargetUrl("http://127.0.0.1:8080/admin");
    expect(loopback2.isAllowed).toBe(false);

    const loopback3 = await validateTargetUrl("http://0.0.0.0:8000");
    expect(loopback3.isAllowed).toBe(false);
  });

  it("blocks AWS / GCP cloud metadata service (169.254.169.254)", async () => {
    const meta1 = await validateTargetUrl("http://169.254.169.254/latest/meta-data/");
    expect(meta1.isAllowed).toBe(false);

    const meta2 = await validateTargetUrl("http://metadata.google.internal/computeMetadata/v1/");
    expect(meta2.isAllowed).toBe(false);
  });

  it("blocks private RFC 1918 subnets (10.x, 172.16.x, 192.168.x)", async () => {
    const privA = await validateTargetUrl("http://10.0.0.1/internal-api");
    expect(privA.isAllowed).toBe(false);

    const privB = await validateTargetUrl("http://172.20.10.2/metrics");
    expect(privB.isAllowed).toBe(false);

    const privC = await validateTargetUrl("http://192.168.1.1/router-setup");
    expect(privC.isAllowed).toBe(false);
  });

  it("blocks non-HTTP protocols (file:, ftp:, gopher:)", async () => {
    const fileUrl = await validateTargetUrl("file:///etc/passwd");
    expect(fileUrl.isAllowed).toBe(false);
    expect(fileUrl.reason).toContain("Unsupported protocol");

    const gopherUrl = await validateTargetUrl("gopher://127.0.0.1:70/");
    expect(gopherUrl.isAllowed).toBe(false);
  });

  it("allows legitimate public HTTPS web application targets", async () => {
    const publicUrl = await validateTargetUrl("https://example.com");
    expect(publicUrl.isAllowed).toBe(true);
    expect(publicUrl.resolvedIp).toBeDefined();
  });

  it("identifies private IPs accurately via isPrivateIp helper", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("10.254.1.2")).toBe(true);
    expect(isPrivateIp("172.16.0.5")).toBe(true);
    expect(isPrivateIp("192.168.0.1")).toBe(true);
    expect(isPrivateIp("169.254.1.1")).toBe(true);
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
  });
});
