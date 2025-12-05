FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y build-essential g++ coreutils timeout && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . /app
# ensure run.sh is executable
RUN chmod +x /app/run.sh
# default command left to run.sh invoked by docker run
CMD ["bash", "run.sh", "input.txt", "user_out.txt"]
