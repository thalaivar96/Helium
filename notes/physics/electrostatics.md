# Electrostatics

## 1. Coulomb's Law and Superposition
The electrostatic force between two point charges $q_1$ and $q_2$ separated by displacement vector $\vec{r}$ in a medium of relative permittivity $\varepsilon_r$ is:

$$\vec{F} = \frac{1}{4\pi\varepsilon_0 \varepsilon_r} \frac{q_1 q_2}{|\vec{r}|^3} \vec{r}$$

- Coulomb constant in vacuum: $\frac{1}{4\pi\varepsilon_0} \approx 9 \times 10^9\ \text{N}\cdot\text{m}^2/\text{C}^2$
- Permittivity of free space: $\varepsilon_0 = 8.854 \times 10^{-12}\ \text{C}^2/\text{N}\cdot\text{m}^2$

## 2. Electric Field ($\vec{E}$) of Standard Charge Distributions

| Charge Distribution | Electric Field Magnitude ($E$) | Remarks |
| :--- | :--- | :--- |
| Uniformly charged ring (axial) | $\frac{kQx}{(R^2 + x^2)^{3/2}}$ | Extrema at $x = \pm \frac{R}{\sqrt{2}}$ |
| Infinite linear charge ($\lambda$) | $\frac{\lambda}{2\pi\varepsilon_0 r}$ | Directed radially |
| Infinite non-conducting sheet ($\sigma$) | $\frac{\sigma}{2\varepsilon_0}$ | Independent of normal distance |
| Surface of a conductor | $\frac{\sigma}{\varepsilon_0}$ | Directed normal to the surface |
| Uniformly charged hollow sphere | $\frac{kQ}{r^2}$ for $r \ge R$ | $E = 0$ for $r < R$ |
| Uniformly charged solid sphere | $\frac{kQr}{R^3} = \frac{\rho r}{3\varepsilon_0}$ for $r < R$ | $\frac{kQ}{r^2}$ for $r \ge R$ |

## 3. Gauss's Law

$$\Phi_E = \oint \vec{E} \cdot d\vec{A} = \frac{q_{\text{in}}}{\varepsilon_0}$$

> **Note:** In the surface integral, $\vec{E}$ represents the net electric field due to all charges in space (both interior and exterior), whereas $q_{\text{in}}$ includes solely the net charge enclosed within the Gaussian surface.

## 4. Electrostatic Potential and Self-Energy
- Differential relation: $$\vec{E} = -\nabla V = -\left(\frac{\partial V}{\partial x}\hat{i} + \frac{\partial V}{\partial y}\hat{j} + \frac{\partial V}{\partial z}\hat{k}\right)$$
- Self-energy of a uniformly charged spherical shell: $$U = \frac{kQ^2}{2R}$$
- Self-energy of a uniformly charged solid sphere: $$U = \frac{3kQ^2}{5R}$$

## 5. Electric Dipole ($\vec{p} = q\vec{d}$)
- Axial field ($r \gg d$): $E_{\text{axial}} = \frac{2kp}{r^3}$ (parallel to $\vec{p}$)
- Equatorial field ($r \gg d$): $E_{\text{eq}} = \frac{kp}{r^3}$ (antiparallel to $\vec{p}$)
- Torque and potential energy in a uniform electric field $\vec{E}$:

$$\vec{\tau} = \vec{p} \times \vec{E}, \qquad U = -\vec{p} \cdot \vec{E}$$
