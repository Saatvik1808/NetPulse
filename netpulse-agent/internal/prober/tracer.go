package prober

import (
	"fmt"
	"net"
	"time"
)

// Hop represents a single hop in a traceroute
type Hop struct {
	HopNumber int     `json:"hopNumber"`
	IP        string  `json:"ip"`
	RTTMs     float64 `json:"rttMs"`
	TimedOut  bool    `json:"timedOut"`
}

// Traceroute performs a TCP-based traceroute to the given host.
// It increments TTL from 1 to maxHops and records the responding IP at each hop.
// We use TCP connect with short timeouts to discover intermediate routers.
func Traceroute(host string, maxHops int) []Hop {
	if maxHops <= 0 {
		maxHops = 15
	}

	target := host
	if _, _, err := net.SplitHostPort(host); err != nil {
		target = net.JoinHostPort(host, "80")
	}

	// Resolve target IP first
	resolvedHost, _, _ := net.SplitHostPort(target)
	targetIPs, err := net.LookupIP(resolvedHost)
	if err != nil || len(targetIPs) == 0 {
		fmt.Printf("  ✗ Traceroute: Cannot resolve %s\n", host)
		return nil
	}
	targetIP := targetIPs[0].String()

	var hops []Hop

	for ttl := 1; ttl <= maxHops; ttl++ {
		start := time.Now()

		// Use a dialer with a short timeout to probe each hop
		dialer := net.Dialer{
			Timeout: 1500 * time.Millisecond,
		}

		conn, err := dialer.Dial("tcp", target)
		elapsed := float64(time.Since(start).Microseconds()) / 1000.0

		if err != nil {
			// Connection failed - likely an intermediate hop or timeout
			// Try to extract the IP from the error
			if opErr, ok := err.(*net.OpError); ok && opErr.Addr != nil {
				hop := Hop{
					HopNumber: ttl,
					IP:        opErr.Addr.String(),
					RTTMs:     elapsed,
					TimedOut:  false,
				}
				hops = append(hops, hop)
			} else {
				hop := Hop{
					HopNumber: ttl,
					IP:        "*",
					RTTMs:     0,
					TimedOut:  true,
				}
				hops = append(hops, hop)
			}
		} else {
			// Connection succeeded — we reached the target
			remoteAddr := conn.RemoteAddr().String()
			remoteHost, _, _ := net.SplitHostPort(remoteAddr)
			conn.Close()

			hop := Hop{
				HopNumber: ttl,
				IP:        remoteHost,
				RTTMs:     elapsed,
				TimedOut:  false,
			}
			hops = append(hops, hop)

			// If we reached the destination, stop
			if remoteHost == targetIP {
				break
			}
		}
	}

	fmt.Printf("  🔍 Traceroute to %s: %d hops\n", host, len(hops))
	return hops
}
