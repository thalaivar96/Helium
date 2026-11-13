# Chemical Thermodynamics

> **IUPAC Sign Convention:** Heat absorbed by the system is positive ($q > 0$), and work done **on** the system is positive ($w > 0$). This convention differs in the sign of work from that standardly adopted in Physics.

## 1. First Law and Thermodynamic Processes

$$\Delta U = q + w, \qquad w = -\int P_{\text{ext}}\, dV$$

| Process | Constraint | Work Done ($w$) | First Law Expression |
| :--- | :--- | :--- | :--- |
| Isochoric | $\Delta V = 0$ | $0$ | $\Delta U = q_V$ |
| Isobaric | $P = \text{constant}$ | $-P_{\text{ext}}(V_2 - V_1)$ | $q_P = \Delta H$ |
| Isothermal (Reversible) | $\Delta T = 0$ | $-nRT \ln\left(\frac{V_2}{V_1}\right) = -2.303\, nRT \log_{10}\left(\frac{P_1}{P_2}\right)$ | $q = -w$ |
| Adiabatic | $q = 0$ | $\frac{nR(T_2 - T_1)}{\gamma - 1} = nC_V \Delta T$ | $\Delta U = w$ |

## 2. Enthalpy ($H$) and Thermochemistry
- Definition and gaseous reaction relation: $H = U + PV \implies \Delta H = \Delta U + \Delta n_g RT$
- Representative equilibrium reaction (Haber process):

$$\ce{N2(g) + 3H2(g) <=> 2NH3(g)} \qquad (\Delta n_g = 2 - 4 = -2)$$

- **Kirchhoff's Equation:**

$$\Delta H_{T_2} - \Delta H_{T_1} = \Delta C_P (T_2 - T_1)$$

- **Reaction Enthalpy from Bond Enthalpies:**

$$\Delta_r H^\circ = \sum \text{BE}_{\text{reactants}} - \sum \text{BE}_{\text{products}}$$

## 3. Entropy ($S$) and Gibbs Free Energy ($G$)
- Entropy change for an ideal gas undergoing a state change:

$$\Delta S = nC_V \ln\left(\frac{T_2}{T_1}\right) + nR \ln\left(\frac{V_2}{V_1}\right)$$

- **Gibbs-Helmholtz Relation:** $\Delta G = \Delta H - T\Delta S$
  - $\Delta G < 0$: Spontaneous process (at constant $T, P$)
  - $\Delta G = 0$: System at equilibrium
  - $\Delta G > 0$: Non-spontaneous process
- Standard Gibbs free energy and equilibrium constant ($K_{\text{eq}}$):

$$\Delta G^\circ = -RT \ln K_{\text{eq}} = -2.303\, RT \log_{10} K_{\text{eq}}$$