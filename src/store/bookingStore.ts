import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MAX_SEATS_PER_BOOKING } from "@/lib/studio/config";
import type { Movie, Seat, Showtime } from "@/types";

interface BookingState {
  movie: Movie | null;
  showtime: Showtime | null;
  selectedSeatIds: string[];
  activeSeatId: string | null;
  setMovie: (movie: Movie) => void;
  setShowtime: (showtime: Showtime | null) => void;
  toggleSeat: (seat: Seat) => void;
  setActiveSeat: (seatId: string) => void;
  clearSeats: () => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      movie: null,
      showtime: null,
      selectedSeatIds: [],
      activeSeatId: null,

      setMovie: (movie) => set({ movie }),

      // A different showtime means different occupied seats, so the selection resets.
      setShowtime: (showtime) =>
        set((state) =>
          state.showtime?.id === showtime?.id
            ? { showtime }
            : { showtime, selectedSeatIds: [], activeSeatId: null },
        ),

      toggleSeat: (seat) =>
        set((state) => {
          if (state.selectedSeatIds.includes(seat.id)) {
            const selectedSeatIds = state.selectedSeatIds.filter((id) => id !== seat.id);
            const activeSeatId =
              state.activeSeatId === seat.id ? (selectedSeatIds.at(-1) ?? null) : state.activeSeatId;
            return { selectedSeatIds, activeSeatId };
          }

          if (seat.status !== "available") return {}; // occupied / unavailable stay untouched
          if (state.selectedSeatIds.length >= MAX_SEATS_PER_BOOKING) return {};

          return { selectedSeatIds: [...state.selectedSeatIds, seat.id], activeSeatId: seat.id };
        }),

      setActiveSeat: (seatId) =>
        set((state) =>
          state.selectedSeatIds.includes(seatId) ? { activeSeatId: seatId } : {},
        ),

      clearSeats: () => set({ selectedSeatIds: [], activeSeatId: null }),
    }),
    {
      name: "cinema-view-booking",
      storage: createJSONStorage(() => sessionStorage),
      // Rehydrated in an effect so the server render and the first client render match.
      skipHydration: true,
    },
  ),
);
