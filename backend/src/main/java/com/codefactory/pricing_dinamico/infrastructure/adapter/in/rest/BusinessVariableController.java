package com.codefactory.pricing_dinamico.infrastructure.adapter.in.rest;

import com.codefactory.pricing_dinamico.application.port.in.ConfigureBusinessVariableUseCase;
import com.codefactory.pricing_dinamico.application.port.in.GetBusinessVariablesUseCase;
import com.codefactory.pricing_dinamico.domain.model.entities.BusinessVariable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/variables")
@CrossOrigin(origins = "http://localhost:8443")
public class BusinessVariableController {

    private final ConfigureBusinessVariableUseCase configureBusinessVariableUseCase;
    private final GetBusinessVariablesUseCase getBusinessVariablesUseCase;

    public BusinessVariableController(ConfigureBusinessVariableUseCase configureBusinessVariableUseCase,
                                       GetBusinessVariablesUseCase getBusinessVariablesUseCase) {
        this.configureBusinessVariableUseCase = configureBusinessVariableUseCase;
        this.getBusinessVariablesUseCase = getBusinessVariablesUseCase;
    }

    @GetMapping
    public ResponseEntity<List<BusinessVariable>> getAll() {
        return ResponseEntity.ok(getBusinessVariablesUseCase.getAllVariables());
    }

    @PostMapping
    public ResponseEntity<BusinessVariable> configure(@RequestBody BusinessVariable variable) {
        BusinessVariable saved = configureBusinessVariableUseCase.configureVariable(variable);
        return ResponseEntity.ok(saved);
    }
}
