package com.codefactory.pricing_dinamico.infrastructure.adapter.out.http;

import com.codefactory.pricing_dinamico.application.port.out.ExternalVariableSourcePort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Repository;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Repository
public class HttpExternalVariableSourceAdapter implements ExternalVariableSourcePort {

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public Long fetchNumericValue(String sourceUrl, String valueField) {

        ResponseEntity<Map> response = restTemplate.getForEntity(sourceUrl, Map.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("La fuente no respondió correctamente");
        }

        Object value = response.getBody().get(valueField);

        if (!(value instanceof Number number)) {
            throw new IllegalStateException(
                    "El campo " + valueField + " no contiene un valor numérico"
            );
        }

        return number.longValue();
    }
}
