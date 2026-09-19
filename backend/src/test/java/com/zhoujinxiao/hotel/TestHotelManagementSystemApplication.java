package com.zhoujinxiao.hotel;

import org.springframework.boot.SpringApplication;

public class TestHotelManagementSystemApplication {

	public static void main(String[] args) {
		SpringApplication.from(HotelManagementSystemApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
