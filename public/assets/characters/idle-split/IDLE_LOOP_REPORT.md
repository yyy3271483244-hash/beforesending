# Pause animation split review

Source clips are the existing processed cutouts derived from the animal administrators' `停顿` videos. Original source and processed files remain unchanged. All outputs retain the shared 320 x 444 character canvas.

| Animal | Entry frames / time | Idle loop | Review |
| --- | --- | --- | --- |
| Cat | 0-96 / 0.000-4.014 s | Not emitted | The clip keeps moving through paw and tail gestures until its final frames; the settled hold is under one second. A loop would repeat a noticeable gesture. Needs a separately generated idle loop. |
| Dog | 0-96 / 0.000-4.014 s | Not emitted | The clip includes the greeting/hop entry and paw repositioning. Only a short final hold remains, too short for a quiet loop. Needs a separately generated idle loop. |
| Mouse | 0-96 / 0.000-4.014 s | Not emitted | The character repeatedly handles paper; the final held pose is brief and does not return naturally to the start. Needs a separately generated idle loop. |
| Rabbit | 0-72 / 0.000-3.021 s | 73-96 / 3.021-4.014 s (0.993 s) | Settled seated reading pose; the loop endpoints are visually close and the segment avoids the sit-down and paper-pickup actions. Endpoint mean absolute difference on the character crop is 1.7/255; seam reviewed as acceptable. |

Files in this directory: `cat_idle_entry.webm`, `dog_idle_entry.webm`, `mouse_idle_entry.webm`, `rabbit_idle_entry.webm`, and `rabbit_idle_loop.webm`.

The three non-loopable characters play their complete entry clip once and hold its final video frame until typing resumes. No new character frames or artificial loops were created. Replace those three with newly generated idle-loop clips when available.
