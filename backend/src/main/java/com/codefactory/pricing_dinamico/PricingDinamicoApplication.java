package com.codefactory.pricing_dinamico;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class PricingDinamicoApplication {

	public static void main(String[] args) {
		SpringApplication.run(PricingDinamicoApplication.class, args);
	}

}
