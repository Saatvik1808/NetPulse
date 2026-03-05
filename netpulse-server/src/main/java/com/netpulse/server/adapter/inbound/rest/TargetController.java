package com.netpulse.server.adapter.inbound.rest;

import com.netpulse.server.adapter.inbound.rest.dto.AddTargetRequest;
import com.netpulse.server.application.service.TargetService;
import com.netpulse.server.domain.model.Target;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/targets")
public class TargetController {

    private final TargetService targetService;

    public TargetController(TargetService targetService) {
        this.targetService = targetService;
    }

    @GetMapping
    public List<Target> getTargets() {
        return targetService.getActiveTargets();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Target addTarget(@RequestBody AddTargetRequest request) {
        return targetService.addTarget(request.host(), request.url(), request.region());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeTarget(@PathVariable Long id) {
        targetService.removeTarget(id);
    }
}
