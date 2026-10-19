package com.codefactory.pricing_dinamico.application.port.in;

public interface AuthorizeOperationUseCase {
    void checkCanModify(String profileIdHeader);
}
