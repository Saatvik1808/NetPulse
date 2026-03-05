"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { MeasurementData } from "@/lib/api";

export function useWebSocket(onMeasurement: (m: MeasurementData) => void) {
    const [connected, setConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);

    const connect = useCallback(() => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

        const client = new Client({
            webSocketFactory: () => new SockJS(`${baseUrl}/ws`),
            reconnectDelay: 5000,

            onConnect: () => {
                console.log("⚡ WebSocket connected");
                setConnected(true);

                client.subscribe("/topic/measurements", (message) => {
                    const data: MeasurementData = JSON.parse(message.body);
                    onMeasurement(data);
                });
            },

            onDisconnect: () => {
                console.log("WebSocket disconnected");
                setConnected(false);
            },

            onStompError: (frame) => {
                console.error("STOMP error:", frame.headers["message"]);
            },
        });

        client.activate();
        clientRef.current = client;
    }, [onMeasurement]);

    useEffect(() => {
        connect();
        return () => {
            clientRef.current?.deactivate();
        };
    }, [connect]);

    return { connected };
}
