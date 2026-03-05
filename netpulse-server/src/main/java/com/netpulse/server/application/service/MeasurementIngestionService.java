package com.netpulse.server.application.service;

import com.netpulse.server.domain.model.Measurement;
import com.netpulse.server.domain.port.MeasurementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MeasurementIngestionService {
    @Autowired
    private  SimpMessagingTemplate messagingTemplate;

    private final MeasurementRepository measurementRepository;

    public MeasurementIngestionService(MeasurementRepository measurementRepository) {
        this.measurementRepository = measurementRepository;
    }

    @Transactional
    public List<Measurement> ingest(List<Measurement> measurements) {
        List<Measurement> saved = measurementRepository.saveAll(measurements);
        // Broadcast each saved measurement to WebSocket subscribers
        saved.forEach(m -> messagingTemplate.convertAndSend("/topic/measurements", m));
        return saved;
    }
}
