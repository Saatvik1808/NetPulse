package com.netpulse.server.application.service;

import com.netpulse.server.domain.model.Target;
import com.netpulse.server.domain.port.TargetRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TargetService {

    private final TargetRepository targetRepository;

    public TargetService(TargetRepository targetRepository) {
        this.targetRepository = targetRepository;
    }

    public List<Target> getActiveTargets() {
        return targetRepository.findActive();
    }

    public Target addTarget(String host, String url, String region) {
        Target newTarget = new Target(null, host, url, region, true, null);
        return targetRepository.save(newTarget);
    }
}
