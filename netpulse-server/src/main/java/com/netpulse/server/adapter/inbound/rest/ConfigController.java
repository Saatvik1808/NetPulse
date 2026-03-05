package com.netpulse.server.adapter.inbound.rest;

import com.netpulse.server.adapter.inbound.rest.dto.ConfigResponse;
import com.netpulse.server.adapter.inbound.rest.dto.UpdateConfigRequest;
import com.netpulse.server.application.service.ConfigService;
import com.netpulse.server.domain.model.AgentConfig;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/config")
public class ConfigController {

    private final ConfigService configService;

    public ConfigController(ConfigService configService) {
        this.configService = configService;
    }

    @GetMapping
    public ConfigResponse getConfig() {
        AgentConfig config = configService.getGlobalConfig();
        return new ConfigResponse(config.browserPinging(), config.browserIntervalMs());
    }

    @PutMapping
    public ConfigResponse updateConfig(@RequestBody UpdateConfigRequest request) {
        AgentConfig updated = configService.updateConfig(
                request.browserPinging(),
                request.browserIntervalMs());
        return new ConfigResponse(updated.browserPinging(), updated.browserIntervalMs());
    }
}
