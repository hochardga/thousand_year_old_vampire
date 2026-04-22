import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("ledger editors", () => {
  it("submits character description and status updates through the character patch route", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            character: {
              description: "Changed by the returning chronicle.",
              id: "character-1",
              kind: "mortal",
              name: "Marta",
              status: "lost",
            },
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            status: 200,
          },
        ),
      );

    const { CharacterEditor } = await import("@/components/archive/CharacterEditor");

    render(
      <CharacterEditor
        characterId="character-1"
        chronicleId="chronicle-1"
        initialDescription="Still mortal in memory."
        initialStatus="active"
      />,
    );

    fireEvent.change(screen.getByLabelText("Character notes"), {
      target: {
        value: "Changed by the returning chronicle.",
      },
    });
    fireEvent.change(screen.getByLabelText("Character status"), {
      target: {
        value: "lost",
      },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save character notes" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body)) as {
      description: string;
      status: string;
    };

    expect(payload).toEqual({
      description: "Changed by the returning chronicle.",
      status: "lost",
    });

    fetchMock.mockRestore();
  });

  it("submits mark detail changes through the mark patch route", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            mark: {
              description: "My reflection lags half a breath behind.",
              id: "mark-1",
              is_active: false,
              is_concealed: true,
              label: "Unsteady Reflection",
            },
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            status: 200,
          },
        ),
      );

    const { MarkEditor } = await import("@/components/archive/MarkEditor");

    render(
      <MarkEditor
        chronicleId="chronicle-1"
        initialDescription="My reflection no longer keeps pace."
        initialIsActive={true}
        initialIsConcealed={false}
        markId="mark-1"
      />,
    );

    fireEvent.change(screen.getByLabelText("Mark description"), {
      target: {
        value: "My reflection lags half a breath behind.",
      },
    });
    fireEvent.click(screen.getByLabelText("Concealed"));
    fireEvent.click(screen.getByLabelText("Dormant"));
    fireEvent.click(screen.getByRole("button", { name: "Save mark details" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body)) as {
      description: string;
      isActive: boolean;
      isConcealed: boolean;
    };

    expect(payload).toEqual({
      description: "My reflection lags half a breath behind.",
      isActive: false,
      isConcealed: true,
    });

    fetchMock.mockRestore();
  });
});
