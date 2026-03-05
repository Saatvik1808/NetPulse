package com.netpulse.server.domain.port;

import com.netpulse.server.domain.model.AgentConfig;
import java.util.Optional;

public interface ConfigRepository {
    Optional<AgentConfig> getConfig();

    AgentConfig save(AgentConfig config);
}
