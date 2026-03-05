package com.netpulse.server.adapter.outbound.persistence;

import com.netpulse.server.domain.model.AgentConfig;
import com.netpulse.server.domain.port.ConfigRepository;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class ConfigRepositoryAdapter implements ConfigRepository {

    private final JpaConfigRepository jpaRepository;

    public ConfigRepositoryAdapter(JpaConfigRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<AgentConfig> getConfig() {
        // We always assume ID 1 is the global singleton config
        return jpaRepository.findById(1L).map(this::mapToDomain);
    }

    @Override
    public AgentConfig save(AgentConfig config) {
        AgentConfigEntity entity = new AgentConfigEntity(
                config.id(),
                config.browserPinging(),
                config.browserIntervalMs());
        AgentConfigEntity saved = jpaRepository.save(entity);
        return mapToDomain(saved);
    }

    private AgentConfig mapToDomain(AgentConfigEntity entity) {
        return new AgentConfig(
                entity.getId(),
                entity.getBrowserPinging(),
                entity.getBrowserIntervalMs());
    }
}
