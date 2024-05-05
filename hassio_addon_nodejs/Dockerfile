ARG BUILD_FROM
FROM $BUILD_FROM

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN apk update
RUN apk add nodejs-current npm

WORKDIR /opt/addon/
COPY src ./src/
COPY *.json run.sh ./
RUN chmod a+x run.sh
RUN npm i

CMD ["./run.sh"]
