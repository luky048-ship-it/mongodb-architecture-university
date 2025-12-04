FROM mongo:7.0.14-jammy

USER root
RUN apt-get update && \
    apt-get install -y wget unzip ca-certificates && \
    apt-get install -y mongodb-database-tools && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1000 appgroup || true \
    && useradd -u 1000 -g 1000 -m appuser || true

RUN mkdir -p /data/db /docker-entrypoint-initdb.d \
    && chown -R 1000:1000 /data/db /docker-entrypoint-initdb.d

USER 1000
