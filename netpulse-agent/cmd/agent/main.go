package main

import (
	"fmt"
	"os"

	"github.com/netpulse/netpulse-agent/internal/config"
	"github.com/netpulse/netpulse-agent/internal/scheduler"
)

func main() {
	cfgPath := "config.yaml"
	if len(os.Args) > 1 {
		cfgPath = os.Args[1]
	}

	cfg, err := config.Load(cfgPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to load config: %v\n", err)
		os.Exit(1)
	}

	scheduler.Run(cfg) // blocks forever
}
