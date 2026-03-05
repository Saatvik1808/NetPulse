package com.netpulse.server.domain.port;

import com.netpulse.server.domain.model.Target;
import java.util.List;

public interface TargetRepository {
    Target save(Target target);

    List<Target> findAll();

    List<Target> findActive();
}
