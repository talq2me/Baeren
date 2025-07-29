import random
import json

# Helper functions
def generate_addition_question(max_val):
    a = random.randint(0, max_val)
    b = random.randint(0, max_val - a)
    question = f"{a} + {b} = ?"
    correct = str(a + b)
    return question, correct

def generate_subtraction_question(max_val):
    a = random.randint(0, max_val)
    b = random.randint(0, a)
    question = f"{a} - {b} = ?"
    correct = str(a - b)
    return question, correct

def generate_dot_question(max_dots):
    correct = random.randint(0, max_dots)
    question = "How many dots? " + "●" * correct
    return question, str(correct)

def generate_choices(correct_answer, choice_range=(0, 10), total_choices=5):
    choices = set()
    choices.add(correct_answer)
    while len(choices) < total_choices:
        choice = str(random.randint(*choice_range))
        choices.add(choice)
    return list(choices)

# Generate questions
questions = []
difficulty_steps = [
    {"type": "dot", "count": 50, "max_dots": 5},
    {"type": "add", "count": 80, "max_val": 5},
    {"type": "sub", "count": 80, "max_val": 5},
    {"type": "add", "count": 45, "max_val": 10},
    {"type": "sub", "count": 45, "max_val": 10}
]

for step in difficulty_steps:
    for _ in range(step["count"]):
        if step["type"] == "dot":
            q, a = generate_dot_question(step["max_dots"])
        elif step["type"] == "add":
            q, a = generate_addition_question(step["max_val"])
        elif step["type"] == "sub":
            q, a = generate_subtraction_question(step["max_val"])
        else:
            continue
        choices = generate_choices(a)
        questions.append({
            "question": q,
            "correctAnswer": a,
            "choices": choices
        })

# Save to JSON file
with open("math_questions.json", "w") as f:
    json.dump(questions, f, indent=2)

print(f"Generated {len(questions)} questions.")
