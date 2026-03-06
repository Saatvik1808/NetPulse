package com.netpulse.server.adapter.inbound.rest;

import com.netpulse.server.adapter.inbound.rest.dto.TracerouteHopResponse;
import com.netpulse.server.adapter.inbound.rest.dto.TracerouteIngestRequest;
import com.netpulse.server.application.service.TracerouteService;
import com.netpulse.server.domain.model.TracerouteHop;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/traceroutes")
public class TracerouteController {

    private final TracerouteService service;

    public TracerouteController(TracerouteService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void ingest(@Valid @RequestBody TracerouteIngestRequest request) {
        List<TracerouteHop> hops = request.hops().stream()
                .map(h -> TracerouteHop.createNew(
                        request.agentId(),
                        request.sourceRegion(),
                        request.targetHost(),
                        h.hopNumber(),
                        h.ip(),
                        h.rttMs(),
                        h.timedOut(),
                        request.tracedAt()))
                .toList();

        service.ingest(hops);
    }

    @GetMapping("/latest")
    public List<TracerouteHopResponse> getLatest(@RequestParam String target) {
        return service.getLatestByTarget(target).stream()
                .map(h -> new TracerouteHopResponse(
                        h.id(), h.agentId(), h.sourceRegion(), h.targetHost(),
                        h.hopNumber(), h.hopIp(), h.hopRttMs(), h.timedOut(), h.tracedAt()))
                .toList();
    }
}
