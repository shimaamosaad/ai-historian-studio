"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Entity = {
  id: number;
  name: string;
  slug: string;
  type: string;
};

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/entities");
        const data = await res.json();
        setEntities(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        Loading...
      </div>
    );
  }

  const people = entities.filter(
    (e) => e.type === "person"
  );

  const places = entities.filter(
    (e) => e.type === "place"
  );

  const events = entities.filter(
    (e) => e.type === "event"
  );

  return (
    <main className="max-w-5xl mx-auto p-8 space-y-10">

      <h1 className="text-4xl font-bold">
        Knowledge Graph
      </h1>

      <section>
        <h2 className="text-2xl font-bold mb-4">
          👤 People
        </h2>

        <ul className="space-y-2">
          {people.map((person) => (
            <li key={person.id}>
              <Link
                href={`/entities/person/${person.slug}`}
                className="text-blue-600 hover:underline"
              >
                {person.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">
          📍 Places
        </h2>

        <ul className="space-y-2">
          {places.map((place) => (
            <li key={place.id}>
              <Link
                href={`/entities/place/${place.slug}`}
                className="text-blue-600 hover:underline"
              >
                {place.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4">
          📅 Events
        </h2>

        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/entities/event/${event.slug}`}
                className="text-blue-600 hover:underline"
              >
                {event.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

    </main>
  );
}