package com.codefactory.pricing_dinamico.application.port.in;

import com.codefactory.pricing_dinamico.domain.model.entities.User;

public interface AuthorizeOperationUseCase {
    User authenticate(String token);
    void checkCanModify(String token);
}
