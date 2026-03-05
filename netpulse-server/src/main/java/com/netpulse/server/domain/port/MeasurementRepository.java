package com.netpulse.server.domain.port;

import com.netpulse.server.domain.model.Measurement;
import java.util.List;


public interface MeasurementRepository {
    Measurement save(Measurement measurement);
    List<Measurement> saveAll(List<Measurement> measurements);
    List<Measurement> findLatest(int limit);
}
