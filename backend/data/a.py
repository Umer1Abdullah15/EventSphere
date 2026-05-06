import cv2
import mediapipe as mp
import numpy as np
import time
import tkinter as tk
from tkinter import ttk
import customtkinter as ctk
from PIL import Image, ImageTk
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import csv
import os
from datetime import datetime

class RehabMotionTracker:
    def __init__(self):
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_pose    = mp.solutions.pose
        self.pose = self.mp_pose.Pose(model_complexity=2,
                                      min_detection_confidence=0.5,
                                      min_tracking_confidence=0.5)

        # storage
        self.data_dir = "rehab_data"
        os.makedirs(self.data_dir, exist_ok=True)

        # ROM history
        self.current_exercise   = "Arm Raise"
        self.historical_max_rom = 0
        self.load_historical_data()

        # runtime
        self.cap               = None
        self.is_recording      = False
        self.start_time        = 0
        self.exercise_data     = []
        self.rep_counter       = 0
        self.last_position     = "down"
        self.angle_threshold   = 100
        self.pain_level        = 0
        self.angle_history     = []
        self.max_history_points= 100
        self.rep_timestamps    = []
        self.last_rep_time     = 0
        self.current_rep_speed = "Normal"
        self.session_max_rom   = 0

        # 20 exercises
        self.exercises = {
            # originals
            "Arm Raise"          : self.track_arm_raise,
            "Knee Bend"          : self.track_knee_bend,
            "Shoulder Rotation"  : self.track_shoulder_rotation,
            "Elbow Flexion"      : self.track_elbow_flexion,
            "Hip Abduction"      : self.track_hip_abduction,
            "Squat"              : self.track_squat,
            "Neck Rotation"      : self.track_neck_rotation,
            "Ankle Dorsiflexion" : self.track_ankle_dorsiflexion,
            "Wrist Flexion"      : self.track_wrist_flexion,
            "Trunk Rotation"     : self.track_trunk_rotation,
            # left-side mirrors
            "Arm Raise Left"         : self.track_arm_raise_left,
            "Elbow Flexion Left"     : self.track_elbow_flexion_left,
            "Knee Bend Left"         : self.track_knee_bend_left,
            "Hip Abduction Left"     : self.track_hip_abduction_left,
            "Shoulder Rotation Left" : self.track_shoulder_rotation_left,
            # extra patterns
            "Calf Raise"         : self.track_calf_raise,
            "Leg Extension"      : self.track_leg_extension,
            "Shoulder Abduction" : self.track_shoulder_abduction,
            "Toe Raise"          : self.track_toe_raise,
            "Hip Extension"      : self.track_hip_extension,
        }

        # build UI  (fixed variable names)
        self.setup_ui()
        self.prev_rom_label.configure(text=f"{self.historical_max_rom:.1f}°")

    # ────────────────────────────────────────────────────────────────────────────
    # LOAD HISTORY   (unchanged)
    # ────────────────────────────────────────────────────────────────────────────
    def load_historical_data(self):
        self.historical_max_rom = 0
        try:
            files = [f for f in os.listdir(self.data_dir)
                     if f.startswith(self.current_exercise) and f.endswith('.csv')]
            if files:
                with open(os.path.join(self.data_dir, sorted(files)[-1]), 'r') as fh:
                    angles = [float(r['angle']) for r in csv.DictReader(fh)]
                    if angles:
                        self.historical_max_rom = max(angles)
        except Exception as e:
            print("History load error:", e)

        if hasattr(self, "prev_rom_label"):
            self.prev_rom_label.configure(text=f"{self.historical_max_rom:.1f}°")

    # ────────────────────────────────────────────────────────────────────────────
    # UI SETUP  – **all variables created before first use**
    # ────────────────────────────────────────────────────────────────────────────
    def setup_ui(self):
        self.root = ctk.CTk()
        self.root.title("Rehabilitation Motion Tracker")
        self.root.geometry("1200x800")
        ctk.set_appearance_mode("dark")

        # top-level containers
        self.main_frame  = ctk.CTkFrame(self.root)
        self.main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.left_panel  = ctk.CTkFrame(self.main_frame)
        self.left_panel.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5, pady=5)

        self.right_panel = ctk.CTkFrame(self.main_frame)
        self.right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5, pady=5)

        # ─── video area ────────────────────────────────────────────────────────
        self.video_frame = ctk.CTkFrame(self.left_panel, fg_color="#1a1a1a")
        self.video_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.video_label = ctk.CTkLabel(self.video_frame, text="")
        self.video_label.pack(fill=tk.BOTH, expand=True)

        # controls (use self.left_panel)
        controls_frame = ctk.CTkFrame(self.left_panel)
        controls_frame.pack(fill=tk.X, padx=5, pady=5)

        # exercise selector
        exercise_frame = ctk.CTkFrame(controls_frame); exercise_frame.pack(fill=tk.X, padx=5, pady=5)
        ctk.CTkLabel(exercise_frame, text="Select Exercise:").pack(side=tk.LEFT, padx=5)
        self.exercise_var = tk.StringVar(value=self.current_exercise)
        ctk.CTkOptionMenu(exercise_frame,
                          values=list(self.exercises.keys()),
                          variable=self.exercise_var,
                          command=self.change_exercise).pack(side=tk.LEFT, padx=5)

        # rep goal
        goal_frame = ctk.CTkFrame(controls_frame); goal_frame.pack(fill=tk.X, padx=5, pady=5)
        ctk.CTkLabel(goal_frame, text="Repetition Goal:").pack(side=tk.LEFT, padx=5)
        self.rep_goal_var = tk.StringVar(value="10")
        ctk.CTkEntry(goal_frame, width=50, textvariable=self.rep_goal_var).pack(side=tk.LEFT, padx=5)

        # pain slider
        pain_frame = ctk.CTkFrame(controls_frame); pain_frame.pack(fill=tk.X, padx=5, pady=5)
        ctk.CTkLabel(pain_frame, text="Pain Level (0-10):").pack(side=tk.LEFT, padx=5)
        self.pain_slider = ctk.CTkSlider(pain_frame, from_=0, to=10,
                                         number_of_steps=10, command=self.update_pain_level)
        self.pain_slider.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=5)
        self.pain_label = ctk.CTkLabel(pain_frame, text="0"); self.pain_label.pack(side=tk.LEFT, padx=5)

        # buttons
        btn_frame = ctk.CTkFrame(controls_frame); btn_frame.pack(fill=tk.X, padx=5, pady=5)
        self.camera_btn = ctk.CTkButton(btn_frame, text="Start Camera", command=self.toggle_camera)
        self.camera_btn.pack(side=tk.LEFT, padx=5)
        self.record_btn = ctk.CTkButton(btn_frame, text="Start Recording",
                                        command=self.toggle_recording, state="disabled")
        self.record_btn.pack(side=tk.LEFT, padx=5)
        self.reset_btn  = ctk.CTkButton(btn_frame, text="Reset Counter",
                                        command=self.reset_counter, state="disabled")
        self.reset_btn.pack(side=tk.LEFT, padx=5)

        # ─── right panel (stats, feedback, graph) ──────────────────────────────
        stats_frame = ctk.CTkFrame(self.right_panel); stats_frame.pack(fill=tk.X, padx=5, pady=5)

        rep_frame  = ctk.CTkFrame(stats_frame); rep_frame.pack(fill=tk.X, padx=5, pady=5)
        ctk.CTkLabel(rep_frame, text="Repetitions:").pack(side=tk.LEFT, padx=5)
        self.rep_label = ctk.CTkLabel(rep_frame, text="0"); self.rep_label.pack(side=tk.LEFT, padx=5)
        self.rep_progress = ctk.CTkProgressBar(rep_frame, width=150); self.rep_progress.pack(side=tk.LEFT, padx=10)

        time_frame = ctk.CTkFrame(stats_frame); time_frame.pack(fill=tk.X, padx=5, pady=5)
        ctk.CTkLabel(time_frame, text="Session Time:").pack(side=tk.LEFT, padx=5)
        self.time_label = ctk.CTkLabel(time_frame, text="00:00"); self.time_label.pack(side=tk.LEFT, padx=5)

        angle_frame = ctk.CTkFrame(stats_frame); angle_frame.pack(fill=tk.X, padx=5, pady=5)
        ctk.CTkLabel(angle_frame, text="Current Angle:").pack(side=tk.LEFT, padx=5)
        self.angle_label = ctk.CTkLabel(angle_frame, text="0°"); self.angle_label.pack(side=tk.LEFT, padx=5)

        rom_frame = ctk.CTkFrame(stats_frame); rom_frame.pack(fill=tk.X, padx=5, pady=5)
        ctk.CTkLabel(rom_frame, text="Max Range of Motion:").pack(side=tk.LEFT, padx=5)
        self.rom_label = ctk.CTkLabel(rom_frame, text="0°"); self.rom_label.pack(side=tk.LEFT, padx=5)

        prev_rom = ctk.CTkFrame(stats_frame); prev_rom.pack(fill=tk.X, padx=5, pady=5)
        ctk.CTkLabel(prev_rom, text="Previous Best ROM:").pack(side=tk.LEFT, padx=5)
        self.prev_rom_label = ctk.CTkLabel(prev_rom, text="0°"); self.prev_rom_label.pack(side=tk.LEFT, padx=5)

        speed_frame = ctk.CTkFrame(stats_frame); speed_frame.pack(fill=tk.X, padx=5, pady=5)
        ctk.CTkLabel(speed_frame, text="Exercise Speed:").pack(side=tk.LEFT, padx=5)
        self.speed_label = ctk.CTkLabel(speed_frame, text="Normal"); self.speed_label.pack(side=tk.LEFT, padx=5)

        # feedback + graph
        feedback_frame = ctk.CTkFrame(self.right_panel); feedback_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.status_label = ctk.CTkLabel(feedback_frame,
                                         text="Welcome to Rehab Motion Tracker\nPress 'Start Camera' to begin",
                                         font=("Arial", 14))
        self.status_label.pack(padx=10, pady=10)

        self.feedback_label = ctk.CTkLabel(feedback_frame, text="", font=("Arial", 12), text_color="#ffd700")
        self.feedback_label.pack(padx=10, pady=5)

        self.figure, self.ax = plt.subplots(figsize=(5, 3))
        self.ax.set_title("Joint Angle Over Time"); self.ax.set_xlabel("Time"); self.ax.set_ylabel("Angle (°)")
        self.ax.set_ylim(0, 180); self.ax.grid(True)
        self.graph_canvas = FigureCanvasTkAgg(self.figure, feedback_frame)
        self.graph_canvas.draw(); self.graph_canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        plt.tight_layout()
        
        # Instructions text
        instructions_text = """
        Exercise Instructions:
        
        Arm Raise:
        - Stand straight with arms at your sides
        - Slowly raise your arms to shoulder level
        - Hold briefly, then lower back down
        - Keep movements smooth and controlled
        
        Knee Bend:
        - Stand with feet shoulder-width apart
        - Slowly bend knees to a comfortable position
        - Return to standing position
        - Maintain good posture throughout
        
        Shoulder Rotation:
        - Raise arm to shoulder height
        - Rotate arm in circular motion
        - Keep movements slow and deliberate
        - Avoid any painful positions
        
        Elbow Flexion:
        - Stand with arms straight at sides
        - Bend elbow to bring hand toward shoulder
        - Return to starting position
        - Keep upper arm stationary
        
        Hip Abduction:
        - Stand straight, holding onto support if needed
        - Raise leg out to the side
        - Keep knee straight and toes pointing forward
        - Return leg to center
        
        Squat:
        - Stand with feet shoulder-width apart
        - Lower body by bending knees and hips
        - Keep back straight and knees behind toes
        - Return to standing position
        
        Neck Rotation:
        - Sit or stand with good posture
        - Slowly turn head to look over shoulder
        - Return to center and repeat on other side
        - Keep shoulders relaxed and down
        
        Ankle Dorsiflexion:
        - Sit with leg extended
        - Pull foot toward shin
        - Hold briefly and return to neutral
        - Keep movement slow and controlled
        
        Wrist Flexion:
        - Hold arm straight with palm facing down
        - Bend wrist to bring hand upward
        - Return to neutral position
        - Keep movements controlled
        
        Trunk Rotation:
        - Sit or stand with good posture
        - Rotate upper body to one side
        - Return to center and rotate to other side
        - Keep hips stable throughout movement
        """
        
        instructions_frame = ctk.CTkFrame(self.right_panel)
        instructions_frame.pack(fill=tk.BOTH, padx=5, pady=5)
        
        instructions_label = ctk.CTkTextbox(instructions_frame, height=150)
        instructions_label.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        instructions_label.insert("1.0", instructions_text)
        instructions_label.configure(state="disabled")

    def update_pain_level(self, value):
        """Update the pain level based on slider value"""
        self.pain_level = int(value)
        self.pain_label.configure(text=str(self.pain_level))
        
        # Adjust feedback based on pain level
        if self.pain_level > 7:
            self.feedback_label.configure(text="WARNING: Pain level is high. Consider stopping exercise.", 
                                         text_color="#ff0000")
        elif self.pain_level > 5:
            self.feedback_label.configure(text="Caution: Moderate pain detected. Consider reducing intensity.", 
                                         text_color="#ff8800")
        elif self.pain_level > 3:
            self.feedback_label.configure(text="Note: Mild discomfort reported. Monitor closely.", 
                                         text_color="#ffcc00")
        else:
            self.feedback_label.configure(text="", text_color="#ffd700")

    def toggle_camera(self):
        if self.cap is None:  # Camera is off, turn it on
            self.cap = cv2.VideoCapture(0)
            if not self.cap.isOpened():
                self.status_label.configure(text="Error: Could not open camera")
                self.cap = None
                return
                
            self.camera_btn.configure(text="Stop Camera")
            self.record_btn.configure(state="normal")
            self.reset_btn.configure(state="normal")
            self.status_label.configure(text="Camera started. Ready to track motion.")
            self.update_frame()
        else:  # Camera is on, turn it off
            if self.is_recording:
                self.toggle_recording()  # Stop recording if active
            self.cap.release()
            self.cap = None
            self.camera_btn.configure(text="Start Camera")
            self.record_btn.configure(state="disabled")
            self.reset_btn.configure(state="disabled")
            self.status_label.configure(text="Camera stopped.")
            # Clear the video display
            blank_image = np.zeros((480, 640, 3), dtype=np.uint8)
            self.display_frame(blank_image)

    def toggle_recording(self):
        if not self.is_recording:  # Start recording
            self.is_recording = True
            self.start_time = time.time()
            self.exercise_data = []
            self.session_max_rom = 0
            self.record_btn.configure(text="Stop Recording")
            self.status_label.configure(text=f"Recording {self.current_exercise}...")
            self.prev_rom_label.configure(text=f"{self.historical_max_rom:.1f}°")
        else:  # Stop recording
            self.is_recording = False
            self.record_btn.configure(text="Start Recording")
            self.status_label.configure(text="Recording stopped. Data saved.")
            self.save_exercise_data()

    def reset_counter(self):
        self.rep_counter = 0
        self.rep_label.configure(text=str(self.rep_counter))
        self.rep_progress.set(0)
        self.angle_history = []
        self.rep_timestamps = []
        self.session_max_rom = 0
        self.rom_label.configure(text="0°")
        self.ax.clear()
        self.ax.set_title("Joint Angle Over Time")
        self.ax.set_xlabel("Time")
        self.ax.set_ylabel("Angle (degrees)")
        self.ax.set_ylim(0, 180)
        self.ax.grid(True)
        self.graph_canvas.draw()
        self.feedback_label.configure(text="")
        self.status_label.configure(text=f"Counter reset. Ready for {self.current_exercise}.")

    def change_exercise(self, exercise_name):
        self.current_exercise = exercise_name
        self.reset_counter()
        self.load_historical_data()  # Load historical data for new exercise
        self.prev_rom_label.configure(text=f"{self.historical_max_rom:.1f}°")
        self.status_label.configure(text=f"Exercise changed to {exercise_name}")
        
        # Reset the last position based on the exercise
        if exercise_name in ["Arm Raise", "Elbow Flexion"]:
            self.last_position = "down"
        elif exercise_name in ["Knee Bend", "Squat"]:
            self.last_position = "straight"
        elif exercise_name in ["Hip Abduction", "Ankle Dorsiflexion", "Trunk Rotation"]:
            self.last_position = "center"
        elif exercise_name == "Wrist Flexion":
            self.last_position = "neutral"
        elif exercise_name == "Neck Rotation":
            self.last_position = "center"
        elif exercise_name == "Shoulder Rotation":
            self.last_position = "down"

        # Adjust angle threshold based on exercise
        if exercise_name in ["Arm Raise"]:
            self.angle_threshold = 100
        elif exercise_name in ["Knee Bend", "Squat"]:
            self.angle_threshold = 120
        elif exercise_name in ["Hip Abduction"]:
            self.angle_threshold = 20
        elif exercise_name in ["Ankle Dorsiflexion"]:
            self.angle_threshold = 15
        elif exercise_name in ["Wrist Flexion"]:
            self.angle_threshold = 30
        elif exercise_name in ["Trunk Rotation"]:
            self.angle_threshold = 45
        elif exercise_name in ["Neck Rotation"]:
            self.angle_threshold = 40
        elif exercise_name in ["Shoulder Rotation"]:
            self.angle_threshold = 90
        elif exercise_name in ["Elbow Flexion"]:
            self.angle_threshold = 70

    def update_frame(self):
        if self.cap is not None:
            ret, frame = self.cap.read()
            if ret:
                # Flip the frame horizontally for a mirror effect
                frame = cv2.flip(frame, 1)
                
                # Convert the BGR image to RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Process the frame with MediaPipe
                results = self.pose.process(rgb_frame)
                
                # Draw pose landmarks on the frame
                if results.pose_landmarks:
                    self.mp_drawing.draw_landmarks(
                        frame, 
                        results.pose_landmarks, 
                        self.mp_pose.POSE_CONNECTIONS,
                        self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2),
                        self.mp_drawing.DrawingSpec(color=(255, 0, 0), thickness=2)
                    )
                    
                    # Track the specific exercise
                    tracking_function = self.exercises.get(self.current_exercise)
                    if tracking_function:
                        angle = tracking_function(results.pose_landmarks, frame)
                        
                        # Update angle display
                        if angle is not None:
                            self.angle_label.configure(text=f"{angle:.1f}°")
                            
                            # Update maximum ROM if needed
                            if angle > self.session_max_rom:
                                self.session_max_rom = angle
                                self.rom_label.configure(text=f"{self.session_max_rom:.1f}°")
                                
                                # Compare with historical max
                                if self.session_max_rom > self.historical_max_rom:
                                    self.feedback_label.configure(text="New personal best range of motion!", 
                                                                text_color="#00ff00")
                            
                            # Store angle data if recording
                            if self.is_recording:
                                elapsed_time = time.time() - self.start_time
                                self.exercise_data.append({
                                    'time': elapsed_time,
                                    'angle': angle,
                                    'rep_count': self.rep_counter,
                                    'pain_level': self.pain_level
                                })
                                
                                # Update the time display
                                mins, secs = divmod(int(elapsed_time), 60)
                                self.time_label.configure(text=f"{mins:02d}:{secs:02d}")
                                
                                # Update angle history for graph
                                self.angle_history.append(angle)
                                if len(self.angle_history) > self.max_history_points:
                                    self.angle_history.pop(0)
                                
                                # Update graph
                                if angle is not None:
                                    self.angle_label.configure(text=f"{angle:.1f}°")
                                    
                                    # Update angle history for graph regardless of recording status
                                    # This ensures the graph updates even when not recording
                                    self.angle_history.append(angle)
                                    if len(self.angle_history) > self.max_history_points:
                                        self.angle_history.pop(0)
                                    
                                    # Update graph
                                    self.update_graph()
                                
                                # Update rep progress bar
                                try:
                                    goal = int(self.rep_goal_var.get())
                                    if goal > 0:
                                        progress = min(1.0, self.rep_counter / goal)
                                        self.rep_progress.set(progress)
                                        
                                        # Give feedback when goal is reached
                                        if self.rep_counter >= goal and self.rep_counter - 1 < goal:
                                            self.feedback_label.configure(text="Goal reached! Great job!", 
                                                                        text_color="#00ff00")
                                except ValueError:
                                    pass  # Ignore if goal is not a valid number
                
                # Display the frame
                self.display_frame(frame)
                
                # Schedule the next frame update
                self.root.after(10, self.update_frame)
            else:
                self.status_label.configure(text="Error: Failed to capture frame")
                self.toggle_camera()  # Turn off camera if frame capture fails

    def calculate_angle(self, a, b, c):
        a, b, c = np.array([a.x, a.y]), np.array([b.x, b.y]), np.array([c.x, c.y])
        ang = np.degrees(abs(np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])))
        return 360 - ang if ang > 180 else ang


    def track_arm_raise(self, landmarks, frame):
        """
        Track arm raise exercise (shoulder angle)
        """
        # Get shoulder, elbow, and hip landmarks for right side
        try:
            shoulder = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
            elbow = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_ELBOW]
            hip = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_HIP]
            
            # Calculate angle
            angle = self.calculate_angle(hip, shoulder, elbow)
            
            # Count reps
            if angle > self.angle_threshold and self.last_position == "down":
                self.last_position = "up"
                self.rep_counter += 1
                self.rep_label.configure(text=str(self.rep_counter))
                self.track_rep_speed()
                
                # Check form and provide feedback
                self.check_exercise_form(landmarks, "arm_raise")
            elif angle < 70 and self.last_position == "up":
                self.last_position = "down"
            
            # Visualize angle
            cv2.putText(frame, f"{angle:.1f}°", 
                       (int(shoulder.x * frame.shape[1]), int(shoulder.y * frame.shape[0])), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            
            return angle
        except:
            return None
    
    def track_arm_raise_left(self, lmk, frame):
        try:
            shoulder = lmk.landmark[self.mp_pose.PoseLandmark.LEFT_SHOULDER]
            elbow    = lmk.landmark[self.mp_pose.PoseLandmark.LEFT_ELBOW]
            hip      = lmk.landmark[self.mp_pose.PoseLandmark.LEFT_HIP]
            angle    = self.calculate_angle(hip, shoulder, elbow)
            if angle > self.angle_threshold and self.last_position == "down":
                self.last_position = "up"; self.rep_counter += 1
                self.rep_label.configure(text=str(self.rep_counter)); self.track_rep_speed()
            elif angle < 70 and self.last_position == "up":
                self.last_position = "down"
            cv2.putText(frame, f"{angle:.1f}°",
                        (int(shoulder.x*frame.shape[1]), int(shoulder.y*frame.shape[0])),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 2)
            return angle
        except: return None
        
    def track_elbow_flexion_left(self, lmk, frame):
        try:
            shoulder = lmk.landmark[self.mp_pose.PoseLandmark.LEFT_SHOULDER]
            elbow    = lmk.landmark[self.mp_pose.PoseLandmark.LEFT_ELBOW]
            wrist    = lmk.landmark[self.mp_pose.PoseLandmark.LEFT_WRIST]
            angle    = self.calculate_angle(shoulder, elbow, wrist)
            if angle < 70 and self.last_position == "down":
                self.last_position="up"; self.rep_counter+=1
                self.rep_label.configure(text=str(self.rep_counter)); self.track_rep_speed()
            elif angle > 150 and self.last_position=="up":
                self.last_position="down"
            cv2.putText(frame, f"{angle:.1f}°",
                        (int(elbow.x*frame.shape[1]), int(elbow.y*frame.shape[0])),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 2)
            return angle
        except: return None

    def track_knee_bend_left(self, lmk, frame):
        try:
            hip  = lmk.landmark[self.mp_pose.PoseLandmark.LEFT_HIP]
            knee = lmk.landmark[self.mp_pose.PoseLandmark.LEFT_KNEE]
            ankle= lmk.landmark[self.mp_pose.PoseLandmark.LEFT_ANKLE]
            angle= self.calculate_angle(hip, knee, ankle)
            if angle < 120 and self.last_position=="straight":
                self.last_position="bent"; self.rep_counter+=1
                self.rep_label.configure(text=str(self.rep_counter)); self.track_rep_speed()
            elif angle > 160 and self.last_position=="bent":
                self.last_position="straight"
            cv2.putText(frame, f"{angle:.1f}°",
                        (int(knee.x*frame.shape[1]), int(knee.y*frame.shape[0])),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 2)
            return angle
        except: return None

    def track_hip_abduction_left(self, lmk, frame):
        try:
            hipR  = lmk.landmark[self.mp_pose.PoseLandmark.RIGHT_HIP]
            hipL  = lmk.landmark[self.mp_pose.PoseLandmark.LEFT_HIP]
            kneeL = lmk.landmark[self.mp_pose.PoseLandmark.LEFT_KNEE]
            # mirror logic of right-side function
            hip_mid = ((hipL.x+hipR.x)/2, (hipL.y+hipR.y)/2)
            v1 = [hipL.x-hip_mid[0], hipL.y-hip_mid[1]]
            v2 = [kneeL.x-hipL.x,    kneeL.y-hipL.y]
            dot = v1[0]*v2[0]+v1[1]*v2[1]
            mag = np.sqrt(v1[0]**2+v1[1]**2)*np.sqrt(v2[0]**2+v2[1]**2)
            if mag==0: return None
            angle = np.degrees(np.arccos(np.clip(dot/mag, -1, 1)))
            disp  = (90-angle) if angle<90 else (angle-90)
            if disp>self.angle_threshold and self.last_position=="center":
                self.last_position="side"; self.rep_counter+=1
                self.rep_label.configure(text=str(self.rep_counter)); self.track_rep_speed()
            elif disp<10 and self.last_position=="side":
                self.last_position="center"
            cv2.putText(frame,f"{disp:.1f}°",
                        (int(hipL.x*frame.shape[1]), int(hipL.y*frame.shape[0])),
                        cv2.FONT_HERSHEY_SIMPLEX,0.5,(255,255,255),2)
            return disp
        except: return None

    def track_shoulder_rotation_left(self, lmk, frame):
        try:
            shoulder = lmk.landmark[self.mp_pose.PoseLandmark.LEFT_SHOULDER]
            elbow    = lmk.landmark[self.mp_pose.PoseLandmark.LEFT_ELBOW]
            wrist    = lmk.landmark[self.mp_pose.PoseLandmark.LEFT_WRIST]
            angle    = self.calculate_angle(shoulder, elbow, wrist)
            wrist_y_norm = (wrist.y - elbow.y)*frame.shape[0]
            if wrist_y_norm<-30 and self.last_position=="down":
                self.last_position="up"; self.rep_counter+=1
                self.rep_label.configure(text=str(self.rep_counter)); self.track_rep_speed()
            elif wrist_y_norm>30 and self.last_position=="up":
                self.last_position="down"
            cv2.putText(frame,f"{angle:.1f}°",
                        (int(elbow.x*frame.shape[1]), int(elbow.y*frame.shape[0])),
                        cv2.FONT_HERSHEY_SIMPLEX,0.5,(255,255,255),2)
            return angle
        except: return None

    # ────────────────────────────────────────────────────────────────────────────────
    # NEW exercise patterns
    # ────────────────────────────────────────────────────────────────────────────────
    def track_calf_raise(self, lmk, frame):
        """Detect heel lift (plantar-flexion)."""
        try:
            knee  = lmk.landmark[self.mp_pose.PoseLandmark.RIGHT_KNEE]
            ankle = lmk.landmark[self.mp_pose.PoseLandmark.RIGHT_ANKLE]
            foot  = lmk.landmark[self.mp_pose.PoseLandmark.RIGHT_FOOT_INDEX]
            angle = self.calculate_angle(knee, ankle, foot)   # 90° ≈ neutral
            dev   = abs(angle-90)
            if dev>self.angle_threshold and self.last_position=="center":
                self.last_position="raised"; self.rep_counter+=1
                self.rep_label.configure(text=str(self.rep_counter)); self.track_rep_speed()
            elif dev<5 and self.last_position=="raised":
                self.last_position="center"
            cv2.putText(frame,f"{dev:.1f}°",
                        (int(ankle.x*frame.shape[1]), int(ankle.y*frame.shape[0])),
                        cv2.FONT_HERSHEY_SIMPLEX,0.5,(255,255,255),2)
            return dev
        except: return None

    def track_leg_extension(self, lmk, frame):
        """Seated knee extension (straighten)."""
        try:
            hip  = lmk.landmark[self.mp_pose.PoseLandmark.RIGHT_HIP]
            knee = lmk.landmark[self.mp_pose.PoseLandmark.RIGHT_KNEE]
            ankle= lmk.landmark[self.mp_pose.PoseLandmark.RIGHT_ANKLE]
            angle= self.calculate_angle(hip, knee, ankle)
            if angle > 160 and self.last_position=="bent":
                self.last_position="straight"; self.rep_counter+=1
                self.rep_label.configure(text=str(self.rep_counter)); self.track_rep_speed()
            elif angle < 120 and self.last_position=="straight":
                self.last_position="bent"
            cv2.putText(frame,f"{angle:.1f}°",
                        (int(knee.x*frame.shape[1]), int(knee.y*frame.shape[0])),
                        cv2.FONT_HERSHEY_SIMPLEX,0.5,(255,255,255),2)
            return angle
        except: return None

    def track_shoulder_abduction(self, lmk, frame):
        """Side arm raise."""
        try:
            hip    = lmk.landmark[self.mp_pose.PoseLandmark.RIGHT_HIP]
            shoulder = lmk.landmark[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
            elbow    = lmk.landmark[self.mp_pose.PoseLandmark.RIGHT_ELBOW]
            angle = self.calculate_angle(hip, shoulder, elbow)
            if angle > self.angle_threshold and self.last_position=="down":
                self.last_position="up"; self.rep_counter+=1
                self.rep_label.configure(text=str(self.rep_counter)); self.track_rep_speed()
            elif angle < 50 and self.last_position=="up":
                self.last_position="down"
            cv2.putText(frame,f"{angle:.1f}°",
                        (int(shoulder.x*frame.shape[1]), int(shoulder.y*frame.shape[0])),
                        cv2.FONT_HERSHEY_SIMPLEX,0.5,(255,255,255),2)
            return angle
        except: return None

    def track_toe_raise(self, lmk, frame):
        """Dorsiflex with weight-bearing – similar threshold but opposite direction."""
        return self.track_ankle_dorsiflexion(lmk, frame)  # reuse logic

    def track_hip_extension(self, lmk, frame):
        """Standing leg drive backward."""
        try:
            shoulder = lmk.landmark[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
            hip      = lmk.landmark[self.mp_pose.PoseLandmark.RIGHT_HIP]
            knee     = lmk.landmark[self.mp_pose.PoseLandmark.RIGHT_KNEE]
            angle    = self.calculate_angle(shoulder, hip, knee)
            if angle > self.angle_threshold and self.last_position=="center":
                self.last_position="extended"; self.rep_counter+=1
                self.rep_label.configure(text=str(self.rep_counter)); self.track_rep_speed()
            elif angle < 20 and self.last_position=="extended":
                self.last_position="center"
            cv2.putText(frame,f"{angle:.1f}°",
                        (int(hip.x*frame.shape[1]), int(hip.y*frame.shape[0])),
                        cv2.FONT_HERSHEY_SIMPLEX,0.5,(255,255,255),2)
            return angle
        except: return None


    def track_knee_bend(self, landmarks, frame):
        """
        Track knee bend exercise (knee angle)
        """
        try:
            hip = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_HIP]
            knee = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_KNEE]
            ankle = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_ANKLE]
            
            # Calculate angle
            angle = self.calculate_angle(hip, knee, ankle)
            
            # Count reps (knee bend)
            if angle < 120 and self.last_position == "straight":
                self.last_position = "bent"
                self.rep_counter += 1
                self.rep_label.configure(text=str(self.rep_counter))
                self.track_rep_speed()
                
                # Check form and provide feedback
                self.check_exercise_form(landmarks, "knee_bend")
            elif angle > 160 and self.last_position == "bent":
                self.last_position = "straight"
            
            # Visualize angle
            cv2.putText(frame, f"{angle:.1f}°", 
                       (int(knee.x * frame.shape[1]), int(knee.y * frame.shape[0])), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            
            return angle
        except:
            return None

    def track_shoulder_rotation(self, landmarks, frame):
        """
        Track shoulder rotation exercise
        """
        try:
            shoulder = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
            elbow = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_ELBOW]
            wrist = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_WRIST]
            
            # Calculate angle
            angle = self.calculate_angle(shoulder, elbow, wrist)
            
            # For shoulder rotation, we're tracking circular movement, so rep counting is approximate
            # Based on when the wrist passes a certain position relative to the elbow
            wrist_y_normalized = (wrist.y - elbow.y) * frame.shape[0]
            
            if wrist_y_normalized < -30 and self.last_position == "down":
                self.last_position = "up"
                self.rep_counter += 1
                self.rep_label.configure(text=str(self.rep_counter))
                self.track_rep_speed()
                
                # Check form and provide feedback
                self.check_exercise_form(landmarks, "shoulder_rotation")
            elif wrist_y_normalized > 30 and self.last_position == "up":
                self.last_position = "down"
            
            # Visualize angle
            cv2.putText(frame, f"{angle:.1f}°", 
                      (int(elbow.x * frame.shape[1]), int(elbow.y * frame.shape[0])), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            
            return angle
        except:
            return None

    def track_elbow_flexion(self, landmarks, frame):
        """
        Track elbow flexion exercise
        """
        try:
            shoulder = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
            elbow = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_ELBOW]
            wrist = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_WRIST]
            
            # Calculate angle
            angle = self.calculate_angle(shoulder, elbow, wrist)
            
            # Count reps
            if angle < 70 and self.last_position == "down":
                self.last_position = "up"
                self.rep_counter += 1
                self.rep_label.configure(text=str(self.rep_counter))
                self.track_rep_speed()
                
                # Check form and provide feedback
                self.check_exercise_form(landmarks, "elbow_flexion")
            elif angle > 150 and self.last_position == "up":
                self.last_position = "down"
            
            # Visualize angle
            cv2.putText(frame, f"{angle:.1f}°", 
                      (int(elbow.x * frame.shape[1]), int(elbow.y * frame.shape[0])), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            
            return angle
        except:
            return None

    def track_hip_abduction(self, landmarks, frame):
        """
        Track hip abduction exercise (leg raise to side)
        """
        try:
            hip_left = landmarks.landmark[self.mp_pose.PoseLandmark.LEFT_HIP]
            hip_right = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_HIP]
            knee = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_KNEE]
            ankle = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_ANKLE]
            
            # Calculate angle between hip midpoint, hip, and knee
            hip_mid_x = (hip_left.x + hip_right.x) / 2
            hip_mid_y = (hip_left.y + hip_right.y) / 2
            
            # Create a point directly below hip
            hip_down_y = hip_right.y + 0.2  # Point below hip
            
            # Calculate vectors
            v1 = [hip_right.x - hip_mid_x, hip_right.y - hip_mid_y]
            v2 = [knee.x - hip_right.x, knee.y - hip_right.y]
            
            # Calculate angle using dot product
            dot_product = v1[0] * v2[0] + v1[1] * v2[1]
            magnitude_v1 = np.sqrt(v1[0]**2 + v1[1]**2)
            magnitude_v2 = np.sqrt(v2[0]**2 + v2[1]**2)
            
            # Prevent division by zero
            if magnitude_v1 * magnitude_v2 == 0:
                return None
                
            cos_angle = dot_product / (magnitude_v1 * magnitude_v2)
            # Clamp cos_angle to [-1, 1] to avoid domain errors
            cos_angle = max(-1, min(1, cos_angle))
            angle = np.degrees(np.arccos(cos_angle))
            
            # Adjust angle for visualization
            display_angle = 90 - angle if angle < 90 else angle - 90
            
            # Count reps for hip abduction
            if display_angle > self.angle_threshold and self.last_position == "center":
                self.last_position = "side"
                self.rep_counter += 1
                self.rep_label.configure(text=str(self.rep_counter))
                self.track_rep_speed()
                
                # Check form and provide feedback
                self.check_exercise_form(landmarks, "hip_abduction")
            elif display_angle < 10 and self.last_position == "side":
                self.last_position = "center"
            
            # Visualize angle
            cv2.putText(frame, f"{display_angle:.1f}°", 
                      (int(hip_right.x * frame.shape[1]), int(hip_right.y * frame.shape[0])), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            
            return display_angle
        except:
            return None

    def track_squat(self, landmarks, frame):
        """
        Track squat exercise
        """
        try:
            hip = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_HIP]
            knee = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_KNEE]
            ankle = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_ANKLE]
            
            # Calculate angle
            angle = self.calculate_angle(hip, knee, ankle)
            
            # Count reps
            if angle < 120 and self.last_position == "straight":
                self.last_position = "squat"
                self.rep_counter += 1
                self.rep_label.configure(text=str(self.rep_counter))
                self.track_rep_speed()
                
                # Check form and provide feedback
                self.check_exercise_form(landmarks, "squat")
            elif angle > 160 and self.last_position == "squat":
                self.last_position = "straight"
            
            # Visualize angle
            cv2.putText(frame, f"{angle:.1f}°", 
                      (int(knee.x * frame.shape[1]), int(knee.y * frame.shape[0])), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            
            return angle
        except:
            return None

    def track_neck_rotation(self, landmarks, frame):
        """
        Track neck rotation exercise
        """
        try:
            # Using shoulder, ear, and nose landmarks to estimate neck rotation
            shoulder = landmarks.landmark[self.mp_pose.PoseLandmark.LEFT_SHOULDER]
            ear = landmarks.landmark[self.mp_pose.PoseLandmark.LEFT_EAR]
            nose = landmarks.landmark[self.mp_pose.PoseLandmark.NOSE]
            
            # Create vectors
            v1 = [ear.x - shoulder.x, ear.y - shoulder.y]
            v2 = [nose.x - ear.x, nose.y - ear.y]
            
            # Calculate angle using dot product
            dot_product = v1[0] * v2[0] + v1[1] * v2[1]
            magnitude_v1 = np.sqrt(v1[0]**2 + v1[1]**2)
            magnitude_v2 = np.sqrt(v2[0]**2 + v2[1]**2)
            
            # Prevent division by zero
            if magnitude_v1 * magnitude_v2 == 0:
                return None
                
            cos_angle = dot_product / (magnitude_v1 * magnitude_v2)
            # Clamp cos_angle to [-1, 1] to avoid domain errors
            cos_angle = max(-1, min(1, cos_angle))
            angle = np.degrees(np.arccos(cos_angle))
            
            # Count reps
            if angle > self.angle_threshold and self.last_position == "center":
                self.last_position = "rotated"
                self.rep_counter += 1
                self.rep_label.configure(text=str(self.rep_counter))
                self.track_rep_speed()
                
                # Check form and provide feedback
                self.check_exercise_form(landmarks, "neck_rotation")
            elif angle < 20 and self.last_position == "rotated":
                self.last_position = "center"
            
            # Visualize angle
            cv2.putText(frame, f"{angle:.1f}°", 
                      (int(ear.x * frame.shape[1]), int(ear.y * frame.shape[0])), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            
            return angle
        except:
            return None

    def track_ankle_dorsiflexion(self, landmarks, frame):
        """
        Track ankle dorsiflexion exercise
        """
        try:
            knee = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_KNEE]
            ankle = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_ANKLE]
            foot_index = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_FOOT_INDEX]
            
            # Calculate angle
            angle = self.calculate_angle(knee, ankle, foot_index)
            
            # Adjust angle for ankle dorsiflexion (typically measured as deviation from 90 degrees)
            adjusted_angle = abs(angle - 90)
            
            # Count reps
            if adjusted_angle > self.angle_threshold and self.last_position == "center":
                self.last_position = "flexed"
                self.rep_counter += 1
                self.rep_label.configure(text=str(self.rep_counter))
                self.track_rep_speed()
                
                # Check form and provide feedback
                self.check_exercise_form(landmarks, "ankle_dorsiflexion")
            elif adjusted_angle < 5 and self.last_position == "flexed":
                self.last_position = "center"
            
            # Visualize angle
            cv2.putText(frame, f"{adjusted_angle:.1f}°", 
                      (int(ankle.x * frame.shape[1]), int(ankle.y * frame.shape[0])), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            
            return adjusted_angle
        except:
            return None

    def track_wrist_flexion(self, landmarks, frame):
        """
        Track wrist flexion exercise
        """
        try:
            elbow = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_ELBOW]
            wrist = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_WRIST]
            index_finger = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_INDEX]
            
            # Calculate angle
            angle = self.calculate_angle(elbow, wrist, index_finger)
            
            # Calculate deviation from neutral position (approximately 180 degrees)
            adjusted_angle = abs(180 - angle)
            
            # Count reps
            if adjusted_angle > self.angle_threshold and self.last_position == "neutral":
                self.last_position = "flexed"
                self.rep_counter += 1
                self.rep_label.configure(text=str(self.rep_counter))
                self.track_rep_speed()
                
                # Check form and provide feedback
                self.check_exercise_form(landmarks, "wrist_flexion")
            elif adjusted_angle < 15 and self.last_position == "flexed":
                self.last_position = "neutral"
            
            # Visualize angle
            cv2.putText(frame, f"{adjusted_angle:.1f}°", 
                      (int(wrist.x * frame.shape[1]), int(wrist.y * frame.shape[0])), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            
            return adjusted_angle
        except:
            return None

    def track_trunk_rotation(self, landmarks, frame):
        """
        Track trunk rotation exercise
        """
        try:
            # Use shoulders and hips to estimate trunk rotation
            left_shoulder = landmarks.landmark[self.mp_pose.PoseLandmark.LEFT_SHOULDER]
            right_shoulder = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
            left_hip = landmarks.landmark[self.mp_pose.PoseLandmark.LEFT_HIP]
            right_hip = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_HIP]
            
            # Calculate vectors for shoulder line and hip line
            shoulder_vector = [right_shoulder.x - left_shoulder.x, right_shoulder.y - left_shoulder.y]
            hip_vector = [right_hip.x - left_hip.x, right_hip.y - left_hip.y]
            
            # Calculate angle between vectors using dot product
            dot_product = shoulder_vector[0] * hip_vector[0] + shoulder_vector[1] * hip_vector[1]
            magnitude_shoulder = np.sqrt(shoulder_vector[0]**2 + shoulder_vector[1]**2)
            magnitude_hip = np.sqrt(hip_vector[0]**2 + hip_vector[1]**2)
            
            # Prevent division by zero
            if magnitude_shoulder * magnitude_hip == 0:
                return None
                
            cos_angle = dot_product / (magnitude_shoulder * magnitude_hip)
            # Clamp cos_angle to [-1, 1] to avoid domain errors
            cos_angle = max(-1, min(1, cos_angle))
            angle = np.degrees(np.arccos(cos_angle))
            
            # Count reps
            if angle > self.angle_threshold and self.last_position == "center":
                self.last_position = "rotated"
                self.rep_counter += 1
                self.rep_label.configure(text=str(self.rep_counter))
                self.track_rep_speed()
                
                # Check form and provide feedback
                self.check_exercise_form(landmarks, "trunk_rotation")
            elif angle < 15 and self.last_position == "rotated":
                self.last_position = "center"
            
            # Visualize angle at midpoint between shoulders
            mid_x = (left_shoulder.x + right_shoulder.x) / 2
            mid_y = (left_shoulder.y + right_shoulder.y) / 2
            cv2.putText(frame, f"{angle:.1f}°", 
                      (int(mid_x * frame.shape[1]), int(mid_y * frame.shape[0])), 
                      cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA)
            
            return angle
        except:
            return None

    def update_graph(self):
        """Update the angle graph with new data"""
        self.ax.clear()
        self.ax.plot(self.angle_history, color='blue')
        self.ax.set_title("Joint Angle Over Time")
        self.ax.set_xlabel("Time")
        self.ax.set_ylabel("Angle (degrees)")
        self.ax.set_ylim(0, max(180, max(self.angle_history) if self.angle_history else 180))
        self.ax.grid(True)
        self.graph_canvas.draw()

    def display_frame(self, frame):
        """Display the frame in the UI"""
        img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(img)
        imgtk = ImageTk.PhotoImage(image=img)
        self.video_label.configure(image=imgtk)
        self.video_label.image = imgtk  # Keep a reference to prevent garbage collection

    def save_exercise_data(self):
        """Save the recorded exercise data to a CSV file"""
        if not self.exercise_data:
            return
            
        # Create a timestamp for the filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{self.current_exercise}_{timestamp}.csv"
        filepath = os.path.join(self.data_dir, filename)
        
        # Write data to CSV
        try:
            with open(filepath, 'w', newline='') as file:
                fieldnames = ['time', 'angle', 'rep_count', 'pain_level']
                writer = csv.DictWriter(file, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(self.exercise_data)
                
            self.status_label.configure(text=f"Data saved to {filename}")
            
            # Update historical max ROM if current session has a new max
            if self.session_max_rom > self.historical_max_rom:
                self.historical_max_rom = self.session_max_rom
                self.prev_rom_label.configure(text=f"{self.historical_max_rom:.1f}°")
        except Exception as e:
            self.status_label.configure(text=f"Error saving data: {e}")

    def track_rep_speed(self):
        """Track the speed of exercise repetitions"""
        current_time = time.time()
        
        if self.rep_counter > 1:  # Need at least 2 reps to calculate speed
            rep_time = current_time - self.last_rep_time
            self.rep_timestamps.append(rep_time)
            
            # Keep only the last 3 reps for speed calculation
            if len(self.rep_timestamps) > 3:
                self.rep_timestamps.pop(0)
            
            # Calculate average rep time
            avg_rep_time = sum(self.rep_timestamps) / len(self.rep_timestamps)
            
            # Determine speed category
            if avg_rep_time < 1.0:
                self.current_rep_speed = "Fast"
                self.speed_label.configure(text="Fast")
                
                # Provide feedback if too fast
                self.feedback_label.configure(text="Slow down for better form", 
                                            text_color="#ff8800")
            elif avg_rep_time > 3.0:
                self.current_rep_speed = "Slow"
                self.speed_label.configure(text="Slow")
            else:
                self.current_rep_speed = "Normal"
                self.speed_label.configure(text="Normal")
        
        self.last_rep_time = current_time

    def check_exercise_form(self, landmarks, exercise_type):
        """Check exercise form and provide feedback"""
        feedback = ""
        
        if exercise_type == "arm_raise":
            # Check if elbow is bent too much
            shoulder = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
            elbow = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_ELBOW]
            wrist = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_WRIST]
            
            elbow_angle = self.calculate_angle(shoulder, elbow, wrist)
            if elbow_angle < 150:
                feedback = "Keep your arm straighter during the raise"
        
        elif exercise_type == "knee_bend":
            # Check if knees are going too far forward
            hip = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_HIP]
            knee = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_KNEE]
            ankle = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_ANKLE]
            
            if knee.x < ankle.x - 0.05:  # Knee too far forward
                feedback = "Keep knees behind toes"
        
        elif exercise_type == "squat":
            # Check if back is not straight
            shoulder = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
            hip = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_HIP]
            knee = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_KNEE]
            
            # Calculate back angle (vertical is ideal)
            back_angle = abs(90 - self.calculate_angle(shoulder, hip, knee))
            if back_angle > 30:
                feedback = "Keep back straighter during squat"
                
            # Check if knees are going too far forward
            ankle = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_ANKLE]
            if knee.x < ankle.x - 0.05:  # Knee too far forward
                feedback = "Keep knees behind toes"
        
        elif exercise_type == "elbow_flexion":
            # Check if upper arm is moving too much
            shoulder = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
            hip = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_HIP]
            
            if abs(shoulder.y - hip.y) < 0.1:  # Upper arm moving away from body
                feedback = "Keep upper arm close to body"
        
        # Add form checks for other exercises as needed
        elif exercise_type == "hip_abduction":
            # Check if knee is bent too much
            hip = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_HIP]
            knee = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_KNEE]
            ankle = landmarks.landmark[self.mp_pose.PoseLandmark.RIGHT_ANKLE]
            
            leg_angle = self.calculate_angle(hip, knee, ankle)
            if leg_angle < 160:
                feedback = "Keep leg straighter during abduction"
        
        # Update feedback label if there's feedback
        if feedback:
            self.feedback_label.configure(text=feedback, text_color="#ff8800")

    def run(self):
        """Run the application"""
        self.root.mainloop()
        
        # Clean up when app is closed
        if self.cap is not None:
            self.cap.release()
        self.pose.close()

if __name__ == "__main__":
    app = RehabMotionTracker()
    app.run()