FROM python:3.10-slim
WORKDIR /app
COPY . .
CMD ["bash", "run.sh", "input.txt", "output.txt"]
