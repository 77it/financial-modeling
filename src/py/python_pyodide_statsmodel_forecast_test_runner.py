# TODO: to be improved, this is a minimal example

import python_pyodide_statsmodel_forecast_func as mod

months = list(range(1, 25))
values = [
    8.9,8.1,6.95,9,10.1,11.2,12.8,9,10.1,10.2,10.99,13,
    10,9,8,10,11,12,14,10,11,11,12,14]

mod.forecast_data(months, values)

print("mean\n")
print(mod.mean)
print("pi_lower\n")
print(mod.pi_lower)
print("pi_upper\n")
print(mod.pi_upper)
