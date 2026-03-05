package com.netpulse.server.application.service;

import com.netpulse.server.domain.model.Measurement;
import com.netpulse.server.domain.port.MeasurementRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MeasurementQueryService {

    private final MeasurementRepository measurementRepository;

    public MeasurementQueryService(MeasurementRepository measurementRepository) {
        this.measurementRepository = measurementRepository;
    }

    public List<Measurement> getLatestMeasurements() {
        return measurementRepository.findLatest(50);
    }
}
