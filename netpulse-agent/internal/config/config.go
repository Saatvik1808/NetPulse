package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Agent    AgentConfig    `yaml:"agent"`
	Server   ServerConfig   `yaml:"server"`
	Targets  []Target       `yaml:"targets"`
	Schedule ScheduleConfig `yaml:"schedule"`
}

type AgentConfig struct {
	ID     string `yaml:"id"`
	Region string `yaml:"region"`
}

type ServerConfig struct {
	URL string `yaml:"url"`
}

type Target struct {
	Host   string `yaml:"host"`
	Region string `yaml:"region"`
}

type ScheduleConfig struct {
	IntervalSeconds int `yaml:"interval_seconds"`
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}
