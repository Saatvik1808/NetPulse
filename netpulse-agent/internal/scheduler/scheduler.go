package scheduler

import (
	"fmt"
	"time"

	"github.com/netpulse/netpulse-agent/internal/config"
	"github.com/netpulse/netpulse-agent/internal/prober"
	"github.com/netpulse/netpulse-agent/internal/sender"
)

func Run(cfg *config.Config) {
	s := sender.New(cfg.Server.URL, cfg.Agent.ID, cfg.Agent.Region)
	interval := time.Duration(cfg.Schedule.IntervalSeconds) * time.Second

	fmt.Printf("NetPulse Agent [%s] starting\n", cfg.Agent.ID)
	fmt.Printf("Region: %s | Targets: %d | Interval: %s\n",
		cfg.Agent.Region, len(cfg.Targets), interval)
	fmt.Println("---")

	// Run immediately on start, then on every tick
	tick := time.NewTicker(interval)
	defer tick.Stop()

	runProbes(cfg, s) // first run immediately
	for range tick.C {
		runProbes(cfg, s)
	}
}

func runProbes(cfg *config.Config, s *sender.Sender) {
	fmt.Printf("[%s] Probing %d targets...\n",
		time.Now().Format("15:04:05"), len(cfg.Targets))

	var results []prober.Result
	for _, target := range cfg.Targets {
		result := prober.Probe(target.Host, target.Region)
		results = append(results, result)
	}

	if err := s.Send(results); err != nil {
		fmt.Printf("  ✗ Failed to send: %v\n", err)
	}
	fmt.Println("---")
}
