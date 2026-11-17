package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.ManageVariableAutoUpdateUseCase;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableAutoUpdateConfig;
import com.codefactory.pricing_dinamico.domain.model.entities.VariableUpdateHistory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/variables/auto-update")
public class VariableAutoUpdateController {

    private final ManageVariableAutoUpdateUseCase manageVariableAutoUpdateUseCase;

    public VariableAutoUpdateController(
            ManageVariableAutoUpdateUseCase manageVariableAutoUpdateUseCase
    ) {
        this.manageVariableAutoUpdateUseCase = manageVariableAutoUpdateUseCase;
    }

    @GetMapping
    public ResponseEntity<List<VariableAutoUpdateConfig>> getConfigurations() {
        return ResponseEntity.ok(manageVariableAutoUpdateUseCase.getConfigurations());
    }

    @PostMapping
    public ResponseEntity<VariableAutoUpdateConfig> saveConfiguration(
            @RequestBody VariableAutoUpdateConfig configuration
    ) {
        return ResponseEntity.ok(
                manageVariableAutoUpdateUseCase.saveConfiguration(configuration)
        );
    }

    @PostMapping("/{variableType}/run")
    public ResponseEntity<VariableUpdateHistory> runUpdate(
            @PathVariable String variableType
    ) {
        return ResponseEntity.ok(
                manageVariableAutoUpdateUseCase.runUpdate(variableType)
        );
    }

    @GetMapping("/{variableType}/history")
    public ResponseEntity<List<VariableUpdateHistory>> getHistory(
            @PathVariable String variableType
    ) {
        return ResponseEntity.ok(
                manageVariableAutoUpdateUseCase.getHistory(variableType)
        );
    }
}
