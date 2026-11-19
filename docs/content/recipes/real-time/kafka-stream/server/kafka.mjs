import KafkaJavaScript from '@confluentinc/kafka-javascript';

const { Kafka, logLevel } = KafkaJavaScript.KafkaJS;

// Stock levels, owned by the warehouse system. Key: SKU. A null value removes the SKU.
export const STOCK_TOPIC = 'inventory.stock';
// Settings the grid edits, owned by the grid. Key: SKU. Value: { reorderPoint }.
export const SETTINGS_TOPIC = 'inventory.settings';

export const kafka = new Kafka({
  kafkaJS: {
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
    logLevel: logLevel.WARN,
  },
});

// Creates both topics as compacted topics: Kafka keeps at least the latest record per
// key, so each topic always holds the current state of every SKU.
export async function ensureTopics() {
  const admin = kafka.admin();

  await admin.connect();

  try {
    const existing = new Set(await admin.listTopics());
    const missing = [STOCK_TOPIC, SETTINGS_TOPIC].filter((topic) => !existing.has(topic));

    if (missing.length > 0) {
      await admin.createTopics({
        topics: missing.map((topic) => ({
          topic,
          numPartitions: 3,
          configEntries: [{ name: 'cleanup.policy', value: 'compact' }],
        })),
      });
    }
  } finally {
    await admin.disconnect();
  }
}
