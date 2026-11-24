package com.codefactory.pricing_dinamico.application.port.out;

public interface ExternalVariableSourcePort {

    Long fetchNumericValue(String sourceUrl, String valueField);
}
