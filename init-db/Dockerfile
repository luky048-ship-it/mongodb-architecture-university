FROM mongo:7.0.14-jammy

USER root
RUN apt-get update && \
    apt-get install -y wget unzip ca-certificates && \
    apt-get install -y mongodb-database-tools && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
