# Build stage
FROM golang:alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o netpulse-agent ./cmd/agent

# Runtime stage
FROM alpine:3.19
WORKDIR /app
RUN apk add --no-cache ca-certificates
COPY --from=build /app/netpulse-agent .
COPY config.yaml .
ENTRYPOINT ["./netpulse-agent"]
