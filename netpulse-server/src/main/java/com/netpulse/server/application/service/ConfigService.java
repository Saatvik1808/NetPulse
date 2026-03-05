package com.netpulse.server.application.service;

import com.netpulse.server.domain.model.AgentConfig;
import com.netpulse.server.domain.port.ConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfigService {

    private final ConfigRepository configRepository;

    public ConfigService(ConfigRepository configRepository) {
        this.configRepository = configRepository;
    }

    public AgentConfig getGlobalConfig() {
        return configRepository.getConfig()
                .orElseGet(() -> new AgentConfig(1L, true, 5000)); // Fallback default
    }

    @Transactional
    public AgentConfig updateConfig(Boolean browserPinging, Integer browserIntervalMs) {
        AgentConfig current = getGlobalConfig();
        AgentConfig updated = new AgentConfig(
                1L,
                browserPinging != null ? browserPinging : current.browserPinging(),
                browserIntervalMs != null ? browserIntervalMs : current.browserIntervalMs());
        return configRepository.save(updated);
    }
}
