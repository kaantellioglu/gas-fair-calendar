from gas_fair_calendar.pipeline import run_auto_update

if __name__ == "__main__":
    result = run_auto_update(seed_if_empty=True)
    print(result)
