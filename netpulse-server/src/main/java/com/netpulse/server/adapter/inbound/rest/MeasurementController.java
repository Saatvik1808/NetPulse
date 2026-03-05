package com.netpulse.server.adapter.inbound.rest;

import com.netpulse.server.adapter.inbound.rest.dto.IngestRequest;
import com.netpulse.server.adapter.inbound.rest.dto.MeasurementResponse;
import com.netpulse.server.application.service.MeasurementIngestionService;
import com.netpulse.server.application.service.MeasurementQueryService;
import com.netpulse.server.domain.model.Measurement;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/measurements")
public class MeasurementController {

    @Autowired
    private  MeasurementQueryService queryService;
    @Autowired
    private  MeasurementIngestionService ingestionService;

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void ingest(@Valid @RequestBody IngestRequest request) {
        List<Measurement> measurements = request.measurements().stream()
                .map(entry -> Measurement.createNew(
                        request.agentId(),
                        request.sourceRegion(),
                        entry.targetHost(),
                        entry.targetRegion(),
                        entry.latencyMs(),
                        entry.packetLoss(),
                        Measurement.MeasurementStatus.valueOf(entry.status()),
                        entry.measuredAt()
                ))
                .toList();

        ingestionService.ingest(measurements);
    }


    // Update the constructor to inject both services:
    public MeasurementController(MeasurementIngestionService ingestionService,
                                 MeasurementQueryService queryService) {
        this.ingestionService = ingestionService;
        this.queryService = queryService;
    }

    @GetMapping("/latest")
    public List<MeasurementResponse> getLatest() {
        return queryService.getLatestMeasurements().stream()
                .map(m -> new MeasurementResponse(
                        m.id(),
                        m.agentId(),
                        m.sourceRegion(),
                        m.targetHost(),
                        m.targetRegion(),
                        m.latencyMs(),
                        m.packetLoss(),
                        m.status().name(),
                        m.measuredAt(),
                        m.createdAt()
                ))
                .toList();
    }

}
