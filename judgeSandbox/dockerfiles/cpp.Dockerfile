FROM gcc:11
WORKDIR /app
COPY . .
CMD ["bash", "run.sh", "input.txt", "output.txt"]
