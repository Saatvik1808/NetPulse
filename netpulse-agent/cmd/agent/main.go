package main

import (
	"fmt"
	"net/http"
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

	// Start a dummy HTTP server so Render.com allows us to use the Free Web Service tier
	go func() {
		port := os.Getenv("PORT")
		if port == "" {
			port = "10000" // Default for Render
		}

		http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("Agent is running!"))
		})

		fmt.Printf("Starting dummy health-check server on port %s for Render...\n", port)
		if err := http.ListenAndServe("0.0.0.0:"+port, nil); err != nil {
			fmt.Fprintf(os.Stderr, "HTTP server error: %v\n", err)
		}
	}()

	scheduler.Run(cfg) // blocks forever
}
