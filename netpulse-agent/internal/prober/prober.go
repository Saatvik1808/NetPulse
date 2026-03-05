package prober

import (
	"fmt"
	"net"
	"time"
)

// Result holds the outcome of a single probe
type Result struct {
	TargetHost   string
	TargetRegion string
	LatencyMs    float64
	PacketLoss   float64
	Status       string
	MeasuredAt   time.Time
}

// Probe measures the TCP connect latency to a target host.
// We use TCP (port 80) instead of ICMP because:
// 1. ICMP requires root/admin privileges
// 2. Many networks block ICMP
// 3. TCP connect latency is a good proxy for network RTT
func Probe(host string, region string) Result {
	target := host
	// If no port specified, default to port 80
	if _, _, err := net.SplitHostPort(host); err != nil {
		target = net.JoinHostPort(host, "80")
	}

	start := time.Now()
	conn, err := net.DialTimeout("tcp", target, 5*time.Second)
	elapsed := time.Since(start)

	if err != nil {
		fmt.Printf("  ✗ %s → TIMEOUT/ERROR (%v)\n", host, err)
		return Result{
			TargetHost:   host,
			TargetRegion: region,
			LatencyMs:    0,
			PacketLoss:   1.0,
			Status:       "TIMEOUT",
			MeasuredAt:   time.Now().UTC(),
		}
	}
	conn.Close()

	latency := float64(elapsed.Microseconds()) / 1000.0 // precise to µs
	fmt.Printf("  ✓ %s → %.2f ms\n", host, latency)

	return Result{
		TargetHost:   host,
		TargetRegion: region,
		LatencyMs:    latency,
		PacketLoss:   0.0,
		Status:       "SUCCESS",
		MeasuredAt:   time.Now().UTC(),
	}
}
