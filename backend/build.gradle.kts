plugins {
    java
    id("org.springframework.boot") version "3.2.5"
    id("io.spring.dependency-management") version "1.1.5"
}

group = "com.weeklycommit"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.flywaydb:flyway-core")
    runtimeOnly("org.postgresql:postgresql")

    implementation("org.springframework.security:spring-security-crypto:6.2.4")
    implementation("com.anthropic:anthropic-java:1.2.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.github.ben-manes.caffeine:caffeine:3.1.8")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.5.0")
    implementation("com.bucket4j:bucket4j-core:8.10.1")
    implementation("org.springframework.boot:spring-boot-starter-mail")
    implementation("com.opencsv:opencsv:5.9")
    implementation("org.apache.pdfbox:pdfbox:3.0.2")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-testcontainers")
    testImplementation("org.testcontainers:testcontainers:1.19.7")
    testImplementation("org.testcontainers:postgresql:1.19.7")
    testImplementation("org.testcontainers:junit-jupiter:1.19.7")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
