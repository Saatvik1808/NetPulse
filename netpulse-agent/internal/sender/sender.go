package sender

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/netpulse/netpulse-agent/internal/config"
	"github.com/netpulse/netpulse-agent/internal/prober"
)

// Sender pushes measurement results to the backend API
type Sender struct {
	serverURL string
	agentID   string
	region    string
	client    *http.Client
}

func New(serverURL, agentID, region string) *Sender {
	return &Sender{
		serverURL: serverURL,
		agentID:   agentID,
		region:    region,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// payload matches the backend's IngestRequest DTO
type payload struct {
	AgentID      string        `json:"agentId"`
	SourceRegion string        `json:"sourceRegion"`
	Measurements []measurement `json:"measurements"`
}

type measurement struct {
	TargetHost   string  `json:"targetHost"`
	TargetRegion string  `json:"targetRegion"`
	LatencyMs    float64 `json:"latencyMs"`
	PacketLoss   float64 `json:"packetLoss"`
	Status       string  `json:"status"`
	MeasuredAt   string  `json:"measuredAt"`
}

func (s *Sender) FetchTargets() ([]config.Target, error) {
	url := s.serverURL + "/api/v1/targets"
	resp, err := s.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("fetch targets error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status fetching targets: %d", resp.StatusCode)
	}

	var targets []struct {
		Host   string `json:"host"`
		Region string `json:"region"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&targets); err != nil {
		return nil, fmt.Errorf("decode targets error: %w", err)
	}

	var result []config.Target
	for _, t := range targets {
		result = append(result, config.Target{
			Host:   t.Host,
			Region: t.Region,
		})
	}

	return result, nil
}

func (s *Sender) Send(results []prober.Result) error {
	var measurements []measurement
	for _, r := range results {
		measurements = append(measurements, measurement{
			TargetHost:   r.TargetHost,
			TargetRegion: r.TargetRegion,
			LatencyMs:    r.LatencyMs,
			PacketLoss:   r.PacketLoss,
			Status:       r.Status,
			MeasuredAt:   r.MeasuredAt.Format(time.RFC3339),
		})
	}

	body := payload{
		AgentID:      s.agentID,
		SourceRegion: s.region,
		Measurements: measurements,
	}

	jsonBytes, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal error: %w", err)
	}

	url := s.serverURL + "/api/v1/measurements"
	resp, err := s.client.Post(url, "application/json", bytes.NewReader(jsonBytes))
	if err != nil {
		return fmt.Errorf("send error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted {
		return fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	fmt.Printf("  → Sent %d measurements (202 Accepted)\n", len(measurements))
	return nil
}
